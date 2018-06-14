const utils = require('../utils/testUtils')
const assert = require('assert');
const ProposalManager = require('Embark/contracts/ProposalManager');
const BN = web3.utils.BN;


config({
  contracts: {
    "MiniMeTokenFactory": {
        "gasLimit": 4000000
    },
    "MiniMeToken": {
        "deploy": false,
    },
    "SNT":{
        "instanceOf": "MiniMeToken",
        "args": [
            "$MiniMeTokenFactory",
            utils.zeroAddress,
            0,
            "TestMiniMeToken",
            18,
            "TST",
            true
        ],
        "gasLimit": 4000000
    },
    "DelegationProxyFactory": {
        "deploy": true,
        "gasLimit": 7000000
    },
    "TrustNetwork": {
        "args": ["$DelegationProxyFactory"],
        "gasLimit": 4000000
    },
    "ProposalManager": { "deploy": false },
    "TCR": {
        "args": ["$SNT", "$TrustNetwork", "0x01"],
        "gasLimit": 4000000
    }
  }
});

describe("TCR", function () {
    this.timeout(0);

    let accounts;
    
    before(function(done) {
        web3.eth.getAccounts().then((acc) => { 
            accounts = acc; 
            return SNT.methods.generateTokens(accounts[0], 1000000000).send()
        }).then((receipt) => { 
            return SNT.methods.generateTokens(accounts[1], 1000000000).send()
        }).then((receipt) => {
            done(); 
        });
    });

    it("controller should be able to change prices", async () => {
        let receipt, submitPrice;

        submitPrice = await TCR.methods.getSubmitPrice(accounts[0]).call();

        const newPrice = 100;
        receipt = await TCR.methods.setSubmitPrice(utils.zeroAddress, true, newPrice).send();
  
        submitPrice = await TCR.methods.getSubmitPrice(accounts[0]).call();
        assert.equal(newPrice, submitPrice, "Prices doesn't match");
    });

    it("SNT holders should be able to submit proposals", async () => {
        let receipt, proposal, proposalId;

        const submitPrice = await TCR.methods.getSubmitPrice(accounts[0]).call();

        receipt = await SNT.methods.approve(TCR.options.address, 1).send();
        assert.equal(!!receipt.events.Approval, true, "Approval not triggered when amount to set is 1");

        TCR.options.jsonInterface = TCR.options.jsonInterface.concat(ProposalManager.options.jsonInterface.filter(x => x.type == 'event'));

        const proposalData = "0x00112244";

        try {
            receipt = await TCR.methods.submitProposal(proposalData, 1).send();
            assert.fail('should have reverted before');
        } catch(error) {
            utils.assertJump(error);
        }

        receipt = await SNT.methods.approve(TCR.options.address, 0).send();
        assert.equal(!!receipt.events.Approval, true, "Approval not triggered on reset");
        
        receipt = await SNT.methods.approve(TCR.options.address, submitPrice).send();
        assert.equal(!!receipt.events.Approval, true, "Approval not triggered when setting new submitPrice");

        receipt = await TCR.methods.submitProposal(proposalData, submitPrice).send();
        assert.equal(!!receipt.events.ProposalSet, true, "ProposalSet not triggered");
        
        proposalId = receipt.events.ProposalSet.returnValues.proposalId;
        proposal = await TCR.methods.proposals(proposalId).call();

        assert.equal(proposal.data, proposalData, "Proposal data is incorrect");
        assert.equal(proposal.owner, accounts[0], "Proposal owner is incorrect");
        assert.equal(proposal.balance, submitPrice, "Proposal unstaked amount is incorrect");

        const balance = await SNT.methods.balanceOf(TCR.options.address).call();
        assert.equal(balance, submitPrice, "Contract did not receive tokens");
    });

    it("owner should increaseBalance and reduceBalance", async () => {
        let receipt, proposal, proposalId, balance, ownerBalance;

        const submitPrice = await TCR.methods.getSubmitPrice(accounts[0]).call();
        receipt = await SNT.methods.approve(TCR.options.address, submitPrice).send();
        receipt = await TCR.methods.submitProposal("0x12", submitPrice).send();
        proposalId = receipt.events.ProposalSet.returnValues.proposalId;

        proposal = await TCR.methods.proposals(proposalId).call();
        const increaseAmount = 10;
        balance = parseInt(proposal.balance);

        receipt = await SNT.methods.approve(TCR.options.address, increaseAmount).send();
        receipt = await TCR.methods.increaseBalance(proposalId, increaseAmount).send();

        ownerBalance = parseInt(await SNT.methods.balanceOf(accounts[0]).call());

        proposal = await TCR.methods.proposals(proposalId).call();
        assert.equal(proposal.balance, balance + increaseAmount, "Proposal balance did not increase");
    
        balance += increaseAmount;
        
        receipt = await TCR.methods.reduceBalance(proposalId, increaseAmount).send();
        
        proposal = await TCR.methods.proposals(proposalId).call();
        assert.equal(proposal.balance, balance - increaseAmount, "Proposal balance did not reduce");

        let newOwnerBalance = parseInt(await SNT.methods.balanceOf(accounts[0]).call());
        assert.equal(ownerBalance + increaseAmount, newOwnerBalance, "Account balance did not increase");

        receipt = await SNT.methods.approve(TCR.options.address, increaseAmount).send({from: accounts[1]});
        try {
            receipt = await TCR.methods.increaseBalance(proposalId, increaseAmount).send({from: accounts[1]});
            assert.fail('should have reverted before');
        } catch(error) {
            utils.assertJump(error);
        }
    });
    
    it("should be able to whitelist a unvoted proposal after period ends", async function(){
        let receipt;
        
        receipt = await TCR.methods.updateVotingPeriod(10).send();

        const submitPrice = await TCR.methods.getSubmitPrice(accounts[0]).call();
        receipt = await SNT.methods.approve(TCR.options.address, submitPrice).send();
        receipt = await TCR.methods.submitProposal("0x12", submitPrice).send();
        proposalId = receipt.events.ProposalSet.returnValues.proposalId;

        let canBeWhiteListed = await TCR.methods.canBeWhitelisted(proposalId).call();
        assert.equal(canBeWhiteListed, false, "Proposal can not be whitelisted now");

        await utils.mineBlocks(11);

        canBeWhiteListed = await TCR.methods.canBeWhitelisted(proposalId).call();
        assert.equal(canBeWhiteListed, true, "Proposal could be whitelisted now");

        receipt = await TCR.methods.processProposal(proposalId).send();
        assert.equal(!!receipt.events.ProposalWhitelisted, true, "ProposalWhitelisted not triggered");
    });


    
    it("shouldn't be able to whitelist a proposal that has votes", async function(){
        let receipt;
        ProposalManager.options.address = await TCR.methods.proposalManager().call();
 
        receipt = await TCR.methods.updateVotingPeriod(10).send();
        const submitPrice = await TCR.methods.getSubmitPrice(accounts[0]).call();
        receipt = await SNT.methods.approve(TCR.options.address, submitPrice).send();
        receipt = await TCR.methods.submitProposal("0x12", submitPrice).send();
        proposalId = receipt.events.ProposalSet.returnValues.proposalId;

        receipt = await ProposalManager.methods.voteProposal(proposalId, 2).send();
        
        await utils.mineBlocks(11);

        canBeWhiteListed = await TCR.methods.canBeWhitelisted(proposalId).call();
        assert.equal(canBeWhiteListed, false, "Proposal cannot be whitelisted");

        try {
            receipt = await TCR.methods.processProposal(proposalId).send();
            assert.fail('should have reverted before');
        } catch(error) {
            utils.assertJump(error);
        }
    });

    it("shouldn't be able to whitelist a proposal that has a challenge", async function(){

    })

});