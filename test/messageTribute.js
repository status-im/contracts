const TestUtils = require("../utils/testUtils.js");

describe('MessageTribute', function() {

    let accounts;
    let SNT;

    const secret = "0x0000000000000000000000000000000000000000000000000000000000123456";

    this.timeout(0);

    before( function(done) {
        this.timeout(0);

        EmbarkSpec.deployAll({
                "MiniMeTokenFactory": {},
                "MiniMeToken": {
                    "args": [
                        "$MiniMeTokenFactory",
                        "0x0",
                        "0x0",
                        "Status Test Token",
                        18,
                        "STT",
                        true
                        ]
                },
                "MessageTribute": {
                    "args": ["$MiniMeToken"]
                }
            }, (_accounts) => { 
            accounts = _accounts;  

            SNT = MiniMeToken;

            Promise.all([
                SNT.methods.generateTokens(accounts[0], 5000).send(),
                SNT.methods.generateTokens(accounts[1], 5000).send(),
                SNT.methods.generateTokens(accounts[2], 5000).send(),
                SNT.methods.generateTokens(accounts[3], 5000).send(),
                SNT.methods.generateTokens(accounts[4], 5000).send(),
                SNT.methods.generateTokens(accounts[5], 5000).send(),
                SNT.methods.generateTokens(accounts[6], 5000).send(),
                SNT.methods.generateTokens(accounts[7], 5000).send(),
                SNT.methods.generateTokens(accounts[8], 5000).send(),
                SNT.methods.generateTokens(accounts[9], 5000).send()
            ])
            .then(() => {
                console.log("  - Added balances");
                done();
            });
        });
    });
    
    it("Adding friends", async () => {
        await MessageTribute.methods.addFriends([accounts[1], accounts[2]]).send({from: accounts[0]});
        await MessageTribute.methods.addFriends([accounts[3]]).send({from: accounts[1]});
        await MessageTribute.methods.addFriends([accounts[4]]).send({from: accounts[1]});
        await MessageTribute.methods.addFriends([accounts[5]]).send({from: accounts[1]});

        assert.equal(
            await MessageTribute.methods.areFriends(accounts[0], accounts[1]).call(),
            true,
            "1. " + accounts[1] + " must be a friend of " + accounts[0]);

        assert.equal(
            await MessageTribute.methods.areFriends(accounts[1], accounts[3]).call(),
            true,
            "2. " + accounts[3] + " must be a friend of " + accounts[1]);

        assert.equal(
            await MessageTribute.methods.areFriends(accounts[0], accounts[4]).call(),
            false,
            "3. " + accounts[4] + " must not be a friend of " + accounts[0]);

        assert.equal(
            await MessageTribute.methods.areFriends(accounts[1], accounts[2]).call(),
            false,
            "4. " + accounts[2] + " must not be a friend of " + accounts[1]);

    });

    it("Removing friends", async () => {
        await MessageTribute.methods.removeFriends([accounts[3]]).send({from: accounts[1]});
        
        await MessageTribute.methods.removeFriends([accounts[4], accounts[5]]).send({from: accounts[1]});

        assert.equal(
            await MessageTribute.methods.areFriends(accounts[0], accounts[3]).call(),
            false,
            accounts[3] + " must not be a friend of " + accounts[0]);
        
        assert.equal(
            await MessageTribute.methods.areFriends(accounts[0], accounts[4]).call(),
            false,
            accounts[4] + " must not be a friend of " + accounts[0]);

        try {
            let tx = await MessageTribute.methods.removeFriends([accounts[5]]).send({from: accounts[1]});
            assert.fail('should have reverted before');
        } catch(error) {
            TestUtils.assertJump(error);
        }
    });

    it("Should be able to deposit", async() => {
        let amount = 2000;

        await SNT.methods.approve(MessageTribute.address, amount).send({from: accounts[1]});
        
        let initialBalance = await SNT.methods.balanceOf(accounts[1]).call();

        await MessageTribute.methods.deposit(amount).send({from: accounts[1]});

        assert.equal(
            await MessageTribute.methods.balance().call({from: accounts[1]}),
            amount,
            "Deposited balance must be " + amount); 

        assert.equal(
            await SNT.methods.balanceOf(accounts[1]).call(),
            web3.utils.toBN(initialBalance).sub(web3.utils.toBN(amount)).toString(),
            accounts[1] + " SNT balance is incorrect"); 

        assert.equal(
            await SNT.methods.balanceOf(MessageTribute.address).call(),
            amount,
            "Contract SNT balance is incorrect");

    });

    it("Should be able to withdraw", async() => {
        let amount = 2000;

        let initialBalance = await SNT.methods.balanceOf(accounts[1]).call();

        await MessageTribute.methods.withdraw(amount).send({from: accounts[1]});
        
        assert.equal(
            await SNT.methods.balanceOf(accounts[1]).call(),
            web3.utils.toBN(initialBalance).add(web3.utils.toBN(amount)).toString(),
            "SNT Balance must be " + initialBalance + amount); 

        assert.equal(
            await SNT.methods.balanceOf(MessageTribute.address).call(),
            0,
            "Contract SNT balance is incorrect");
        
        assert.equal(
            await MessageTribute.methods.balance().call({from: accounts[1]}),
            0,
            "Deposited balance must be 0"); 
        
    });

    it("Requesting audience without requiring deposit", async () => {
        assert.equal(
            await MessageTribute.methods.balance().call({from: accounts[9]}),
            0,
            "Deposited balance must be 0"); 

        let hashedSecret = web3.utils.soliditySha3(accounts[0], accounts[9], secret);

        let tx = await MessageTribute.methods.requestAudience(accounts[0], hashedSecret).send({from: accounts[9]});

        assert.notEqual(tx.events.AudienceRequested, undefined, "AudienceRequested wasn't triggered");

    });

    it("Requesting audience requiring deposit and no funds deposited", async () => {
        await MessageTribute.methods.setRequiredTribute(accounts[9], 100, true).send({from: accounts[0]});
        
        assert.equal(
            await MessageTribute.methods.balance().call({from: accounts[9]}),
            0,
            "Deposited balance must be 0"); 

        assert.equal(
            await MessageTribute.methods.hasEnoughFundsToTalk(accounts[0]).call({from: accounts[9]}),
            false,
            "Must return false");

        try {
            let hashedSecret = web3.utils.soliditySha3(accounts[0], accounts[9], secret);

            let tx = await MessageTribute.methods.requestAudience(accounts[0], hashedSecret).send({from: accounts[9]});
            assert.fail('should have reverted before');
        } catch(error) {
            TestUtils.assertJump(error);
        }
    });

    it("Requesting an audience as a friend", async() => {
       assert.equal(
        await MessageTribute.methods.areFriends(accounts[0], accounts[2]).call(),
        true,
        "Should be friends"); 

        assert.equal(
            await MessageTribute.methods.balance().call({from: accounts[2]}),
            0,
            "Deposited balance must be 0"); 

        assert.equal(
            await MessageTribute.methods.hasEnoughFundsToTalk(accounts[0]).call({from: accounts[2]}),
            true,
            "Must return true");

        let hashedSecret = web3.utils.soliditySha3(accounts[0], accounts[2], secret);

        let tx = await MessageTribute.methods.requestAudience(accounts[0], hashedSecret).send({from: accounts[2]});
        
        assert.notEqual(tx.events.AudienceRequested, undefined, "AudienceRequested wasn't triggered");
    });


    it("Request audience requiring deposit, not having funds at the beginning, deposit funds and request audience", async () => {
        await MessageTribute.methods.setRequiredTribute(accounts[8], 200, true).send({from: accounts[0]});
        
        await SNT.methods.approve(MessageTribute.address, 100).send({from: accounts[8]});
        await MessageTribute.methods.deposit(100).send({from: accounts[8]});

        assert.equal(
            await MessageTribute.methods.balance().call({from: accounts[8]}),
            100,
            "Deposited balance must be 100"); 

        assert.equal(
            await MessageTribute.methods.hasEnoughFundsToTalk(accounts[0]).call({from: accounts[8]}),
            false,
            "Must return false");

        let hashedSecret = web3.utils.soliditySha3(accounts[0], accounts[2], secret);
        
        try {
            let tx = await MessageTribute.methods.requestAudience(accounts[0], hashedSecret).send({from: accounts[8]});
            assert.fail('should have reverted before');
        } catch(error) {
            TestUtils.assertJump(error);
        }

        await SNT.methods.approve(MessageTribute.address, 100).send({from: accounts[8]});
        await MessageTribute.methods.deposit(100).send({from: accounts[8]});

        assert.equal(
            await MessageTribute.methods.balance().call({from: accounts[8]}),
            200,
            "Deposited balance must be 200"); 

        assert.equal(
            await MessageTribute.methods.hasEnoughFundsToTalk(accounts[0]).call({from: accounts[8]}),
            true,
            "Must return true");
        
        let tx = await MessageTribute.methods.requestAudience(accounts[0], hashedSecret).send({from: accounts[8]});
    
        assert.notEqual(tx.events.AudienceRequested, undefined, "AudienceRequested wasn't triggered");
    });


    it("Requesting tribute from specific account", async() => {
        await MessageTribute.methods.setRequiredTribute(accounts[7], 100,  true).send({from: accounts[0]});
        
        await SNT.methods.approve(MessageTribute.address, 200).send({from: accounts[7]});
        await MessageTribute.methods.deposit(200).send({from: accounts[7]});

        assert.equal(
            await MessageTribute.methods.balance().call({from: accounts[7]}),
            200,
            "Deposited balance must be 200"); 

        let hashedSecret = web3.utils.soliditySha3(accounts[0], accounts[7], secret);

        let tx = await MessageTribute.methods.requestAudience(accounts[0], hashedSecret).send({from: accounts[7]});
        
        assert.notEqual(tx.events.AudienceRequested, undefined, "AudienceRequested wasn't triggered");
    
        assert.equal(
            await MessageTribute.methods.balance().call({from: accounts[7]}),
            100,
            "Deposited balance must be 100"); 
     });

     it("Cancelling an audience", async() => {
        
        assert.equal(
            await MessageTribute.methods.hasPendingAudience(accounts[0], accounts[8]).call(),
            true,
            "Must have a pending audience");

        // Commented because it requires moving the evm timestamp, and current version of testrpc seems to not support it
        /*
        let tx = await MessageTribute.methods.cancelAudienceRequest(accounts[0]).send({from: accounts[8]});

        assert.notEqual(tx.events.AudienceCancelled, undefined, "AudienceCancelled wasn't triggered");

        assert.equal(
            await MessageTribute.methods.hasPendingAudience(accounts[0]).call({from: accounts[8]}),
            false,
            "Must not have a pending audience");
        */

     });

     it("Cancelling an audience without having one", async() => {
        
        assert.equal(
            await MessageTribute.methods.hasPendingAudience(accounts[0], accounts[6]).call(),
            false,
            "Must not have a pending audience");

        try {
            let tx = await MessageTribute.methods.cancelAudienceRequest(accounts[0]).send({from: accounts[6]});
            assert.fail('should have reverted before');
        } catch(error) {
            TestUtils.assertJump(error);
        }
     });

     it("Granting an audience that requires a permanent tribute", async() => {
        
        let initial7balance = (await SNT.methods.balanceOf(accounts[7]).call()).toString();
        let initial0balance = (await SNT.methods.balanceOf(accounts[0]).call()).toString();
        let initialCBalance = (await SNT.methods.balanceOf(MessageTribute.address).call()).toString();
        let initial7DepBalance = (await MessageTribute.methods.balance().call({from: accounts[7]})).toString();
        let amount = (await MessageTribute.methods.getRequiredFee(accounts[0]).call({from: accounts[7]})).toString();
     
        assert.equal(
            await MessageTribute.methods.hasPendingAudience(accounts[0], accounts[7]).call(),
            true,
            "Must have a pending audience");
        
        let hashedSecret = web3.utils.soliditySha3(accounts[0], accounts[7], secret);
        
        let tx = await MessageTribute.methods.grantAudience(accounts[7], true, false, secret).send({from: accounts[0]});

        assert.notEqual(tx.events.AudienceGranted, undefined, "AudienceGranted wasn't triggered");

        assert.equal(
            await SNT.methods.balanceOf(accounts[7]).call(),
            initial7balance,
            accounts[7] + " SNT Balance must be " + initial7balance); 

        assert.equal(
            await SNT.methods.balanceOf(accounts[0]).call(),
            web3.utils.toBN(initial0balance).add(web3.utils.toBN(amount)).toString(),
            accounts[0] + "SNT Balance must be " + initial0balance); 

        assert.equal(
            await SNT.methods.balanceOf(MessageTribute.address).call(),
            web3.utils.toBN(initialCBalance).sub(web3.utils.toBN(amount)).toString(),
            accounts[0] + "SNT Balance must be " + web3.utils.toBN(initialCBalance).sub(web3.utils.toBN(amount)).toString());

        assert.equal(
            await MessageTribute.methods.balance().call({from: accounts[7]}),
            initial7DepBalance,
            accounts[0] + "SNT deposit balance must be 0");

        assert.equal(
            await MessageTribute.methods.hasPendingAudience(accounts[0], accounts[7]).call(),
            false,
            "Must not have a pending audience");
     });

     it("Denying an audience", async() => {

        let amount = (await MessageTribute.methods.getRequiredFee(accounts[0]).call({from: accounts[7]})).toString();

        let initial7DepBalance = (await MessageTribute.methods.balance().call({from: accounts[7]})).toString();

        let hashedSecret = web3.utils.soliditySha3(accounts[0], accounts[7], secret);

        let tx = await MessageTribute.methods.requestAudience(accounts[0], hashedSecret).send({from: accounts[7]});

        let afterReq7DepBalance = (await MessageTribute.methods.balance().call({from: accounts[7]})).toString();
        assert.equal(
            afterReq7DepBalance,
            web3.utils.toBN(initial7DepBalance).sub(web3.utils.toBN(amount)).toString(),
            accounts[7] + "SNT deposit balance error");

        assert.notEqual(tx.events.AudienceRequested, undefined, "AudienceRequested wasn't triggered");
    
        let tx2 = await MessageTribute.methods.grantAudience(accounts[7], false, false, secret).send({from: accounts[0]});

        assert.notEqual(tx2.events.AudienceGranted, undefined, "AudienceGranted wasn't triggered");

        let afterDeny7DepBalance = (await MessageTribute.methods.balance().call({from: accounts[7]})).toString();
        
        assert.equal(
            initial7DepBalance,
            afterDeny7DepBalance,
            accounts[7] + "SNT deposit balance error");

        assert.equal(
                await MessageTribute.methods.hasPendingAudience(accounts[0], accounts[7]).call(),
                false,
                "Must not have a pending audience");
     });
     
     it("Requesting a non permanent tribute from specific account", async() => {
        await MessageTribute.methods.setRequiredTribute(accounts[6], 100, false).send({from: accounts[0]});
        let amount1 = (await MessageTribute.methods.getRequiredFee(accounts[0]).call({from: accounts[6]})).toString();
        
        await SNT.methods.approve(MessageTribute.address, 200).send({from: accounts[6]});
        await MessageTribute.methods.deposit(200).send({from: accounts[6]});

        let hashedSecret = web3.utils.soliditySha3(accounts[0], accounts[6], secret);
        
        let tx = await MessageTribute.methods.requestAudience(accounts[0], hashedSecret).send({from: accounts[6]});
    
        assert.notEqual(tx.events.AudienceRequested, undefined, "AudienceRequested wasn't triggered");
    
        assert.equal(
            await MessageTribute.methods.balance().call({from: accounts[6]}),
            100,
            "Deposited balance must be 100"); 

        let tx2 = await MessageTribute.methods.grantAudience(accounts[6], true, false, secret).send({from: accounts[0]});
        assert.notEqual(tx2.events.AudienceGranted, undefined, "AudienceGranted wasn't triggered");

        let amount = (await MessageTribute.methods.getRequiredFee(accounts[0]).call({from: accounts[6]})).toString();
        
        assert.equal(
            amount,
            0,
            "Amount should be 0"); 


     });

     it("Other tests", async () => {
        /*
        TODO

        // Granting an audience that requires 200 tribute non permanent
        await MessageTribute.methods.setRequiredTribute(accounts[4], 200, true, false).send({from: accounts[0]});

        // Requiring 100 deposit from everyone
        await MessageTribute.methods.setRequiredTribute("0x0", 100, false, true).send({from: accounts[0]});
      
        // Requiring 100 tribute from everyone
        await MessageTribute.methods.setRequiredTribute("0x0", 100, true, true).send({from: accounts[1]});
*/
    });


    
});