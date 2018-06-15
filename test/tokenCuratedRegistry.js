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
        "args": ["$SNT", "$TrustNetwork", "0x00"],
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
            return TCR.methods.proposalManager().call();
        }).then((address) => {
            ProposalManager.options.address = address; 
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
        assert.equal(!!receipt.events.ProposalSubmitted, true, "ProposalSubmitted not triggered");
        
        proposalId = receipt.events.ProposalSubmitted.returnValues.proposalId;
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
        proposalId = receipt.events.ProposalSubmitted.returnValues.proposalId;

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
        
        receipt = await TCR.methods.updatePeriods(10, 10).send();

        const submitPrice = await TCR.methods.getSubmitPrice(accounts[0]).call();
        receipt = await SNT.methods.approve(TCR.options.address, submitPrice).send();
        receipt = await TCR.methods.submitProposal("0x12", submitPrice).send();
        proposalId = receipt.events.ProposalSubmitted.returnValues.proposalId;

        let canBeWhiteListed = await TCR.methods.canBeWhitelisted(proposalId).call();
        assert.equal(canBeWhiteListed, false, "Proposal can not be whitelisted now");

        await utils.mineBlocks(11);

        canBeWhiteListed = await TCR.methods.canBeWhitelisted(proposalId).call();
        assert.equal(canBeWhiteListed, true, "Proposal could be whitelisted now");

        receipt = await TCR.methods.processProposal(proposalId).send();
        assert.equal(!!receipt.events.ProposalWhitelisted, true, "ProposalWhitelisted not triggered");
    });
    
    it("shouldn't be able to whitelist a proposal that has been challenged", async function(){
        let receipt;
        
        // Boilerplate
        receipt = await TCR.methods.updatePeriods(10, 10).send();
        const submitPrice = parseInt(await TCR.methods.getSubmitPrice(accounts[0]).call());
       
        receipt = await SNT.methods.approve(TCR.options.address, submitPrice).send();
        receipt = await TCR.methods.submitProposal("0x12", submitPrice).send();
        proposalId = receipt.events.ProposalSubmitted.returnValues.proposalId;

        // Test
        let account1BalanceA = parseInt(await SNT.methods.balanceOf(accounts[1]).call());

        receipt = await SNT.methods.approve(TCR.options.address, 0).send({from: accounts[1]});
        receipt = await SNT.methods.approve(TCR.options.address, submitPrice).send({from: accounts[1]});
        receipt = await TCR.methods.challenge(proposalId).send({from: accounts[1]});
        assert.equal(!!receipt.events.ProposalChallenged, true, "ProposalChallenged not triggered");

        let account1BalanceB = parseInt(await SNT.methods.balanceOf(accounts[1]).call());
        let proposal = await TCR.methods.proposals(proposalId).call();
        let challenge = await TCR.methods.challenges(proposal.challengeID).call();

        assert(challenge.stake, submitPrice, "Stake does not match submitPrice");

        await utils.mineBlocks(11);

        canBeWhiteListed = await TCR.methods.canBeWhitelisted(proposalId).call();
        assert.equal(canBeWhiteListed, false, "Proposal cannot be whitelisted");

    });

    it("SNT holders should be able to delist a proposal when it doesn't have enough stake", async function(){
        let receipt;
        
        // Boilerplate
        receipt = await TCR.methods.updatePeriods(10, 10).send();
        let submitPrice = await TCR.methods.getSubmitPrice(accounts[0]).call();
       
        receipt = await SNT.methods.approve(TCR.options.address, submitPrice).send();
        receipt = await TCR.methods.submitProposal("0x12", submitPrice).send();
        proposalId = receipt.events.ProposalSubmitted.returnValues.proposalId;

        // Test
        submitPrice = parseInt(submitPrice) + 10;
        receipt = await TCR.methods.setSubmitPrice(utils.zeroAddress, true, submitPrice).send();

        receipt = await SNT.methods.approve(TCR.options.address, 0).send({from: accounts[1]});
        receipt = await SNT.methods.approve(TCR.options.address, submitPrice).send({from: accounts[1]});
        receipt = await TCR.methods.challenge(proposalId).send({from: accounts[1]});

        assert.equal(!!receipt.events.ProposalDelisted, true, "ProposalDelisted not triggered");
        proposal = await TCR.methods.proposals(proposalId).call();

        assert.equal(proposal.owner, utils.zeroAddress, "Proposal wasn't deleted");
    });

    it("A whitelisted proposal can be challenged", async function(){
        let receipt;
        
        // Boilerplate
        receipt = await TCR.methods.updatePeriods(10, 10).send();
        const submitPrice = await TCR.methods.getSubmitPrice(accounts[0]).call();

        receipt = await SNT.methods.approve(TCR.options.address, submitPrice).send();
        receipt = await TCR.methods.submitProposal("0x12", submitPrice).send();
        proposalId = receipt.events.ProposalSubmitted.returnValues.proposalId;
        await utils.mineBlocks(11);
        canBeWhiteListed = await TCR.methods.canBeWhitelisted(proposalId).call();
        receipt = await TCR.methods.processProposal(proposalId).send();

        // Test
        receipt = await SNT.methods.approve(TCR.options.address, 0).send({from: accounts[1]});
        receipt = await SNT.methods.approve(TCR.options.address, submitPrice).send({from: accounts[1]});
        receipt = await TCR.methods.challenge(proposalId).send({from: accounts[1]});
        assert.equal(!!receipt.events.ProposalChallenged, true, "ProposalChallenged not triggered");  
    });

    it("only should allow a single challenge", async function(){
        let receipt;
        
        // Boilerplate
        receipt = await TCR.methods.updatePeriods(10, 10).send();
        const submitPrice = await TCR.methods.getSubmitPrice(accounts[0]).call(); 
        receipt = await SNT.methods.approve(TCR.options.address, submitPrice).send();
        receipt = await TCR.methods.submitProposal("0x12", submitPrice).send();
        proposalId = receipt.events.ProposalSubmitted.returnValues.proposalId;
        receipt = await SNT.methods.approve(TCR.options.address, 0).send({from: accounts[1]});
        receipt = await SNT.methods.approve(TCR.options.address, submitPrice).send({from: accounts[1]});
        receipt = await TCR.methods.challenge(proposalId).send({from: accounts[1]});

        // Test
        try {
            receipt = await TCR.methods.challenge(proposalId).send({from: accounts[1]});
            assert.fail('should have reverted before');
        } catch(error) {
            utils.assertJump(error);
        }

    });

    it("challenged proposal's owner should earn stake if no there are no votes", async function(){
        let receipt;

        // Boilerplate
        receipt = await TCR.methods.updatePeriods(10, 10).send();
        const submitPrice = parseInt(await TCR.methods.getSubmitPrice(accounts[0]).call()); 
        receipt = await SNT.methods.approve(TCR.options.address, submitPrice).send();
        receipt = await TCR.methods.submitProposal("0x12", submitPrice).send();
        proposalId = receipt.events.ProposalSubmitted.returnValues.proposalId;
        receipt = await SNT.methods.approve(TCR.options.address, 0).send({from: accounts[1]});
        receipt = await SNT.methods.approve(TCR.options.address, submitPrice).send({from: accounts[1]});
        let proposal = await TCR.methods.proposals(proposalId).call();
        const proposalBalanceA = parseInt(proposal.balance);
        receipt = await TCR.methods.challenge(proposalId).send({from: accounts[1]});

        // Test
        const challengeId = receipt.events.ProposalChallenged.returnValues.challengeId;
        let challenge = await TCR.methods.challenges(challengeId).call();
        const challengeStake = parseInt(challenge.stake);

        await utils.mineBlocks(11);

        receipt = await ProposalManager.methods.tabulateVote(challengeId, accounts[0]).send();
        
        receipt = await ProposalManager.methods.finalResult(challengeId).send();
        assert.equal(!!receipt.events.ProposalResult, true, "ProposalResult not triggered");

        receipt = await TCR.methods.processProposal(proposalId).send();
        assert.equal(!!receipt.events.ChallengeFailed, true, "ChallengeFailed not triggered");
        assert.equal(!!receipt.events.ProposalWhitelisted, true, "ProposalWhitelisted not triggered");
        
        proposal = await TCR.methods.proposals(proposalId).call();
        const proposalBalanceB = parseInt(proposal.balance);

        assert.equal(proposalBalanceA + challengeStake, proposalBalanceB, "New proposal balance doesn't match");
    });

    it("challenged proposal's owner and approval voters should earn stake if they win", async function(){
    });

    it("challenger and reject voters should earn stake if they win", async function(){

    });
});