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
    "BasicTCR": {
        "args": ["$SNT", "$TrustNetwork"],
        "gasLimit": 4000000
    }
  }
});

describe("BasicTCR", function () {
    this.timeout(0);

    let accounts;
    
    before(function(done) {
        
        web3.eth.getAccounts().then((acc) => { 
            accounts = acc; 
            return SNT.methods.generateTokens(accounts[0], 1000000000).send()
        }).then((receipt) => { 
            return SNT.methods.generateTokens(accounts[1], 1000000000).send()
        }).then((receipt) => { 
            return SNT.methods.generateTokens(accounts[2], 500000000).send()
        }).then((receipt) => { 
            return SNT.methods.generateTokens(accounts[3], 500000000).send()
        }).then((receipt) => {
            return BasicTCR.methods.proposalManager().call();
        }).then((address) => {
            ProposalManager.options.address = address; 
            done(); 
        });
    });

    it("controller should be able to change prices", async () => {
        let receipt, submitPrice;

        submitPrice = await BasicTCR.methods.getSubmitPrice(accounts[0]).call();

        const newPrice = 100;
        receipt = await BasicTCR.methods.setSubmitPrice(utils.zeroAddress, false, newPrice).send();
  
        submitPrice = await BasicTCR.methods.getSubmitPrice(accounts[0]).call();
        assert.equal(newPrice, submitPrice, "Prices doesn't match");
    });

    it("SNT holders should be able to submit items", async () => {
        let receipt, item, itemId;

        const submitPrice = await BasicTCR.methods.getSubmitPrice(accounts[0]).call();

        receipt = await SNT.methods.approve(BasicTCR.options.address, 1).send();
        assert.equal(!!receipt.events.Approval, true, "Approval not triggered when amount to set is 1");

        const itemData = "0x00112244";

        try {
            receipt = await BasicTCR.methods.submitItem(itemData, 1).send();
            assert.fail('should have reverted before');
        } catch(error) {
            utils.assertJump(error);
        }

        receipt = await SNT.methods.approve(BasicTCR.options.address, 0).send();
        assert.equal(!!receipt.events.Approval, true, "Approval not triggered on reset");
        
        receipt = await SNT.methods.approve(BasicTCR.options.address, submitPrice).send();
        assert.equal(!!receipt.events.Approval, true, "Approval not triggered when setting new submitPrice");

        receipt = await BasicTCR.methods.submitItem(itemData, submitPrice).send();
        assert.equal(!!receipt.events.ItemSubmitted, true, "ItemSubmitted not triggered");
        
        itemId = receipt.events.ItemSubmitted.returnValues.itemId;
        item = await BasicTCR.methods.items(itemId).call();

        assert.equal(item.data, itemData, "Item data is incorrect");
        assert.equal(item.owner, accounts[0], "Item owner is incorrect");
        assert.equal(item.balance, submitPrice, "Item unstaked amount is incorrect");

        const balance = await SNT.methods.balanceOf(BasicTCR.options.address).call();
        assert.equal(balance, submitPrice, "Contract did not receive tokens");
    });

    it("owner should increaseBalance and reduceBalance", async () => {
        let receipt, item, itemId, balance, ownerBalance;

        const submitPrice = await BasicTCR.methods.getSubmitPrice(accounts[0]).call();
        receipt = await SNT.methods.approve(BasicTCR.options.address, submitPrice).send();
        receipt = await BasicTCR.methods.submitItem("0x12", submitPrice).send();
        itemId = receipt.events.ItemSubmitted.returnValues.itemId;

        item = await BasicTCR.methods.items(itemId).call();
        const increaseAmount = 10;
        balance = parseInt(item.balance);

        receipt = await SNT.methods.approve(BasicTCR.options.address, increaseAmount).send();
        receipt = await BasicTCR.methods.increaseBalance(itemId, increaseAmount).send();

        ownerBalance = parseInt(await SNT.methods.balanceOf(accounts[0]).call());

        item = await BasicTCR.methods.items(itemId).call();
        assert.equal(item.balance, balance + increaseAmount, "Item balance did not increase");
    
        balance += increaseAmount;
        
        receipt = await BasicTCR.methods.reduceBalance(itemId, increaseAmount).send();
        
        item = await BasicTCR.methods.items(itemId).call();
        assert.equal(item.balance, balance - increaseAmount, "Item balance did not reduce");

        let newOwnerBalance = parseInt(await SNT.methods.balanceOf(accounts[0]).call());
        assert.equal(ownerBalance + increaseAmount, newOwnerBalance, "Account balance did not increase");

        receipt = await SNT.methods.approve(BasicTCR.options.address, increaseAmount).send({from: accounts[1]});
        try {
            receipt = await BasicTCR.methods.increaseBalance(itemId, increaseAmount).send({from: accounts[1]});
            assert.fail('should have reverted before');
        } catch(error) {
            utils.assertJump(error);
        }
    });
    
    it("should be able to whitelist a unvoted item after period ends", async function(){
        let receipt;
        
        receipt = await BasicTCR.methods.updatePeriods(10, 10).send();

        const submitPrice = await BasicTCR.methods.getSubmitPrice(accounts[0]).call();
        receipt = await SNT.methods.approve(BasicTCR.options.address, submitPrice).send();
        receipt = await BasicTCR.methods.submitItem("0x12", submitPrice).send();
        itemId = receipt.events.ItemSubmitted.returnValues.itemId;

        let canBeWhiteListed = await BasicTCR.methods.canBeWhitelisted(itemId).call();
        assert.equal(canBeWhiteListed, false, "Item can not be whitelisted now");

        await utils.mineBlocks(11);

        canBeWhiteListed = await BasicTCR.methods.canBeWhitelisted(itemId).call();
        assert.equal(canBeWhiteListed, true, "Item could be whitelisted now");

        receipt = await BasicTCR.methods.processItem(itemId).send();
        assert.equal(!!receipt.events.ItemWhitelisted, true, "ItemWhitelisted not triggered");
    });
    
    it("shouldn't be able to whitelist a item that has been challenged", async function(){
        let receipt;
        
        // Boilerplate
        receipt = await BasicTCR.methods.updatePeriods(10, 10).send();
        const submitPrice = parseInt(await BasicTCR.methods.getSubmitPrice(accounts[0]).call());
       
        receipt = await SNT.methods.approve(BasicTCR.options.address, submitPrice).send();
        receipt = await BasicTCR.methods.submitItem("0x12", submitPrice).send();
        itemId = receipt.events.ItemSubmitted.returnValues.itemId;

        // Test
        let account1BalanceA = parseInt(await SNT.methods.balanceOf(accounts[1]).call());

        receipt = await SNT.methods.approve(BasicTCR.options.address, 0).send({from: accounts[1]});
        receipt = await SNT.methods.approve(BasicTCR.options.address, submitPrice).send({from: accounts[1]});
        receipt = await BasicTCR.methods.challenge(itemId).send({from: accounts[1]});
        assert.equal(!!receipt.events.ItemChallenged, true, "ItemChallenged not triggered");

        let account1BalanceB = parseInt(await SNT.methods.balanceOf(accounts[1]).call());
        let item = await BasicTCR.methods.items(itemId).call();
        let challenge = await BasicTCR.methods.challenges(item.challengeId).call();

        assert(challenge.stake, submitPrice, "Stake does not match submitPrice");

        await utils.mineBlocks(11);

        canBeWhiteListed = await BasicTCR.methods.canBeWhitelisted(itemId).call();
        assert.equal(canBeWhiteListed, false, "Item cannot be whitelisted");

    });

    it("SNT holders should be able to delist a item when it doesn't have enough stake", async function(){
        let receipt;
        
        // Boilerplate
        receipt = await BasicTCR.methods.updatePeriods(10, 10).send();
        let submitPrice = await BasicTCR.methods.getSubmitPrice(accounts[0]).call();
       
        receipt = await SNT.methods.approve(BasicTCR.options.address, submitPrice).send();
        receipt = await BasicTCR.methods.submitItem("0x12", submitPrice).send();
        itemId = receipt.events.ItemSubmitted.returnValues.itemId;

        // Test
        submitPrice = parseInt(submitPrice) + 10;
        receipt = await BasicTCR.methods.setSubmitPrice(utils.zeroAddress, false, submitPrice).send();

        receipt = await SNT.methods.approve(BasicTCR.options.address, 0).send({from: accounts[1]});
        receipt = await SNT.methods.approve(BasicTCR.options.address, submitPrice).send({from: accounts[1]});
        receipt = await BasicTCR.methods.challenge(itemId).send({from: accounts[1]});

        assert.equal(!!receipt.events.ItemDelisted, true, "ItemDelisted not triggered");
        item = await BasicTCR.methods.items(itemId).call();

        assert.equal(item.owner, utils.zeroAddress, "Item wasn't deleted");
    });

    it("A whitelisted item can be challenged", async function(){
        let receipt;
        
        // Boilerplate
        receipt = await BasicTCR.methods.updatePeriods(10, 10).send();
        const submitPrice = await BasicTCR.methods.getSubmitPrice(accounts[0]).call();

        receipt = await SNT.methods.approve(BasicTCR.options.address, submitPrice).send();
        receipt = await BasicTCR.methods.submitItem("0x12", submitPrice).send();
        itemId = receipt.events.ItemSubmitted.returnValues.itemId;
        await utils.mineBlocks(11);
        canBeWhiteListed = await BasicTCR.methods.canBeWhitelisted(itemId).call();
        receipt = await BasicTCR.methods.processItem(itemId).send();

        // Test
        receipt = await SNT.methods.approve(BasicTCR.options.address, 0).send({from: accounts[1]});
        receipt = await SNT.methods.approve(BasicTCR.options.address, submitPrice).send({from: accounts[1]});
        receipt = await BasicTCR.methods.challenge(itemId).send({from: accounts[1]});
        assert.equal(!!receipt.events.ItemChallenged, true, "ItemChallenged not triggered");  
    });

    it("only should allow a single challenge", async function(){
        let receipt;
        
        // Boilerplate
        receipt = await BasicTCR.methods.updatePeriods(10, 10).send();
        const submitPrice = await BasicTCR.methods.getSubmitPrice(accounts[0]).call(); 
        receipt = await SNT.methods.approve(BasicTCR.options.address, submitPrice).send();
        receipt = await BasicTCR.methods.submitItem("0x12", submitPrice).send();
        itemId = receipt.events.ItemSubmitted.returnValues.itemId;
        receipt = await SNT.methods.approve(BasicTCR.options.address, 0).send({from: accounts[1]});
        receipt = await SNT.methods.approve(BasicTCR.options.address, submitPrice).send({from: accounts[1]});
        receipt = await BasicTCR.methods.challenge(itemId).send({from: accounts[1]});

        // Test
        try {
            receipt = await BasicTCR.methods.challenge(itemId).send({from: accounts[1]});
            assert.fail('should have reverted before');
        } catch(error) {
            utils.assertJump(error);
        }

    });

    it("challenged item's owner should earn stake if no there are no votes", async function(){
        let receipt;

        // Boilerplate
        receipt = await BasicTCR.methods.updatePeriods(10, 10).send();
        const submitPrice = parseInt(await BasicTCR.methods.getSubmitPrice(accounts[0]).call()); 
        receipt = await SNT.methods.approve(BasicTCR.options.address, submitPrice).send();
        receipt = await BasicTCR.methods.submitItem("0x12", submitPrice).send();
        itemId = receipt.events.ItemSubmitted.returnValues.itemId;
        receipt = await SNT.methods.approve(BasicTCR.options.address, 0).send({from: accounts[1]});
        receipt = await SNT.methods.approve(BasicTCR.options.address, submitPrice).send({from: accounts[1]});
        let item = await BasicTCR.methods.items(itemId).call();
        const itemBalanceA = parseInt(item.balance);
        receipt = await BasicTCR.methods.challenge(itemId).send({from: accounts[1]});

        // Test
        const challengeId = receipt.events.ItemChallenged.returnValues.challengeId;
        let challenge = await BasicTCR.methods.challenges(challengeId).call();
        const challengeStake = parseInt(challenge.stake);

        await utils.mineBlocks(11);

        receipt = await ProposalManager.methods.tabulateVote(challengeId, accounts[0]).send();
        
        receipt = await ProposalManager.methods.finalResult(challengeId).send();
        assert.equal(!!receipt.events.ProposalResult, true, "ProposalResult not triggered");

        receipt = await BasicTCR.methods.processItem(itemId).send();
        assert.equal(!!receipt.events.ChallengeFailed, true, "ChallengeFailed not triggered");
        assert.equal(!!receipt.events.ItemWhitelisted, true, "ItemWhitelisted not triggered");
        
        item = await BasicTCR.methods.items(itemId).call();
        const itemBalanceB = parseInt(item.balance);

        assert.equal(itemBalanceA + challengeStake, itemBalanceB, "New item balance doesn't match");
    });

    it("challenged item's owner and approval voters should earn stake if they win", async function(){
        let receipt;

        // Boilerplate
        receipt = await BasicTCR.methods.updatePeriods(10, 10).send();
        const submitPrice = parseInt(await BasicTCR.methods.getSubmitPrice(accounts[0]).call()); 
        receipt = await SNT.methods.approve(BasicTCR.options.address, submitPrice).send();
        receipt = await BasicTCR.methods.submitItem("0x12", submitPrice).send();
        itemId = receipt.events.ItemSubmitted.returnValues.itemId;
        receipt = await SNT.methods.approve(BasicTCR.options.address, 0).send({from: accounts[1]});
        receipt = await SNT.methods.approve(BasicTCR.options.address, submitPrice).send({from: accounts[1]});
        let item = await BasicTCR.methods.items(itemId).call();
        const itemBalanceA = parseInt(item.balance);
        receipt = await BasicTCR.methods.challenge(itemId).send({from: accounts[1]});
        const challengeId = receipt.events.ItemChallenged.returnValues.challengeId;
        let challenge = await BasicTCR.methods.challenges(challengeId).call();
        const challengeStake = parseInt(challenge.stake);

        // Test
        receipt = await ProposalManager.methods.voteProposal(challengeId, 2).send({from: accounts[0]});
        receipt = await ProposalManager.methods.voteProposal(challengeId, 2).send({from: accounts[2]});
                
        receipt = await ProposalManager.methods.voteProposal(challengeId, 2).send({from: accounts[3]});

        await utils.mineBlocks(11);

        // TODO: should each voter call tabulateVote?
        receipt = await ProposalManager.methods.tabulateVote(challengeId, accounts[0]).send({from: accounts[0]});
        receipt = await ProposalManager.methods.tabulateVote(challengeId, accounts[2]).send({from: accounts[2]});
        receipt = await ProposalManager.methods.tabulateVote(challengeId, accounts[3]).send({from: accounts[3]});

        receipt = await ProposalManager.methods.finalResult(challengeId).send();
        assert(receipt.events.ProposalResult.returnValues.finalResult, 2, "Item should have been approved");
        receipt = await BasicTCR.methods.processItem(itemId).send();
    
        item = await BasicTCR.methods.items(itemId).call();

        const itemBalanceB = parseInt(item.balance);
        assert(itemBalanceB, itemBalanceA + challengeStake - parseInt(challenge.rewardPool), "Item Balance did not increase");
        
        const account2BalanceA = parseInt(await SNT.methods.balanceOf(accounts[2]).call());
        receipt = await BasicTCR.methods.claimReward(challengeId).send({from: accounts[2]});
        const account2BalanceB = parseInt(await SNT.methods.balanceOf(accounts[2]).call());

        // TODO: calculate balance of account 2 to see if it increased by 8 (based on 30% for voters)
    });

    it("challenger and reject voters should earn stake if they win", async function(){

    });
});