const TestUtils = require("../utils/testUtils.js");
const MessageTributeUtils = require("../utils/messageTributeUtils.js");
const identityJson = require('../dist/contracts/Identity.json');
const idUtils = require('../utils/identityUtils.js');

describe('MessageTribute', function() {

    let identityFactory;
    let identity;
    let accounts;
    let identities = [];
    let idInstances = [];
    let SNT;

    this.timeout(0);

    before( function(done) {
        this.timeout(0);

        EmbarkSpec.deployAll({
                "IdentityFactory": {
                    args: ["0xaaaa"],
                    gas: 5000000
                },
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
            }, async (_accounts) => { 
            accounts = _accounts;  

        SNT = MiniMeToken;

        identities[0] = new web3.eth.Contract(identityJson.abi, (await IdentityFactory.methods.createIdentity().send({from: accounts[0]})).events.IdentityCreated.returnValues.instance, {from: accounts[0]});
   /*     identities[1] = new web3.eth.Contract(identityJson.abi, (await IdentityFactory.methods.createIdentity().send({from: accounts[1]})).events.IdentityCreated.returnValues.instance);
        identities[2] = new web3.eth.Contract(identityJson.abi, (await IdentityFactory.methods.createIdentity().send({from: accounts[2]})).events.IdentityCreated.returnValues.instance);
        identities[3] = new web3.eth.Contract(identityJson.abi, (await IdentityFactory.methods.createIdentity().send({from: accounts[3]})).events.IdentityCreated.returnValues.instance);
        identities[4] = new web3.eth.Contract(identityJson.abi, (await IdentityFactory.methods.createIdentity().send({from: accounts[4]})).events.IdentityCreated.returnValues.instance);
        identities[5] = new web3.eth.Contract(identityJson.abi, (await IdentityFactory.methods.createIdentity().send({from: accounts[5]})).events.IdentityCreated.returnValues.instance);
        identities[6] = new web3.eth.Contract(identityJson.abi, (await IdentityFactory.methods.createIdentity().send({from: accounts[6]})).events.IdentityCreated.returnValues.instance);
        identities[7] = new web3.eth.Contract(identityJson.abi, (await IdentityFactory.methods.createIdentity().send({from: accounts[7]})).events.IdentityCreated.returnValues.instance);
        identities[8] = new web3.eth.Contract(identityJson.abi, (await IdentityFactory.methods.createIdentity().send({from: accounts[8]})).events.IdentityCreated.returnValues.instance);
        identities[9] = new web3.eth.Contract(identityJson.abi, (await IdentityFactory.methods.createIdentity().send({from: accounts[9]})).events.IdentityCreated.returnValues.instance);
*/

try {
    await identities[0].methods.execute(identities[0].options.address, 0, idUtils.encode.addKey(accounts[2], idUtils.purposes.ACTION, idUtils.types.ADDRESS)).send({from: accounts[0]})


} catch(Er){
    console.log(Er);
}
             


        Promise.all([
                //  identities[1].methods.execute(identities[1].options.address, 0, idUtils.encode.addKey(accounts[1], idUtils.purposes.ACTION, idUtils.types.ADDRESS)).send({from: accounts[1]}),

                SNT.methods.generateTokens(identities[0].options.address, 5000).send(),
                SNT.methods.generateTokens(identities[1].options.address, 5000).send(),
                SNT.methods.generateTokens(identities[2].options.address, 5000).send(),
                SNT.methods.generateTokens(identities[3].options.address, 5000).send(),
                SNT.methods.generateTokens(identities[4].options.address, 5000).send(),
                SNT.methods.generateTokens(identities[5].options.address, 5000).send(),
                SNT.methods.generateTokens(identities[6].options.address, 5000).send(),
                SNT.methods.generateTokens(identities[7].options.address, 5000).send(),
                SNT.methods.generateTokens(identities[8].options.address, 5000).send(),
                SNT.methods.generateTokens(identities[9].options.address, 5000).send()
            ])
            .then(() => {
                console.log("  - Added balances");
                done();
            });
        });
    });
    
    it("Adding friends", async () => {
        
       /* let tx = await identities[0].methods.execute(
            MessageTribute.options.address, 
            0, 
            MessageTributeUtils.encode.addFriends([accounts[1], accounts[2]])
            ).send({from: accounts[0]});
console.log(tx);
*/
        await MessageTribute.methods.addFriends([accounts[1], accounts[2]]).send({from: accounts[0]});
        await MessageTribute.methods.addFriends([accounts[3]]).send({from: accounts[1]});
        await MessageTribute.methods.addFriends([accounts[4]]).send({from: accounts[1]});
        await MessageTribute.methods.addFriends([accounts[5]]).send({from: accounts[1]});

        assert.equal(
            await MessageTribute.methods.areFriends(identities[0].options.address, identities[1].options.address).call(),
            true,
            identities[1].options.address + " must be a friend of " + identities[0].options.address);

        assert.equal(
            await MessageTribute.methods.areFriends(identities[1].options.address, identities[3].options.address).call(),
            true,
            identities[3].options.address + " must be a friend of " + identities[1].options.address);

        assert.equal(
            await MessageTribute.methods.areFriends(identities[0].options.address, identities[4].options.address).call(),
            false,
            identities[4].options.address + " must not be a friend of " + identities[0].options.address);

        assert.equal(
            await MessageTribute.methods.areFriends(identities[1].options.address, identities[2].options.address).call(),
            false,
            identities[2].options.address + " must not be a friend of " + identities[1].options.address);

    });
















    it("Removing friends", async () => {
        await MessageTribute.methods.removeFriends([accounts[3]]).send({from: accounts[1]});
        
        await MessageTribute.methods.removeFriends([accounts[4], accounts[5]]).send({from: accounts[1]});

        assert.equal(
            await MessageTribute.methods.isFriend(accounts[3]).call({from: accounts[0]}),
            false,
            accounts[3] + " must not be a friend of " + accounts[0]);
        
        assert.equal(
            await MessageTribute.methods.isFriend(accounts[4]).call({from: accounts[0]}),
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

        assert.equal(
            await SNT.methods.balanceOf(MessageTribute.address).call(),
            amount,
            "Contract SNT balance is incorrect");

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

        let tx = await MessageTribute.methods.requestAudience(accounts[0]).send({from: accounts[9]});

        assert.notEqual(tx.events.AudienceRequested, undefined, "AudienceRequested wasn't triggered");

    });

    it("Requesting audience requiring deposit and no funds deposited", async () => {
        await MessageTribute.methods.setRequiredTribute(accounts[9], 100, false, true).send({from: accounts[0]});
        
        assert.equal(
            await MessageTribute.methods.balance().call({from: accounts[9]}),
            0,
            "Deposited balance must be 0"); 

        assert.equal(
            await MessageTribute.methods.hasEnoughFundsToTalk(accounts[0]).call({from: accounts[9]}),
            false,
            "Must return false");

        try {
            let tx = await MessageTribute.methods.requestAudience(accounts[0]).send({from: accounts[9]});
            assert.fail('should have reverted before');
        } catch(error) {
            TestUtils.assertJump(error);
        }
    });

    it("Requesting an audience as a friend", async() => {
       assert.equal(
        await MessageTribute.methods.isFriend(accounts[2]).call({from: accounts[0]}),
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

        let tx = await MessageTribute.methods.requestAudience(accounts[0]).send({from: accounts[2]});
        
        assert.notEqual(tx.events.AudienceRequested, undefined, "AudienceRequested wasn't triggered");
    });


    it("Request audience requiring deposit, not having funds at the beginning, deposit funds and request audience", async () => {
        await MessageTribute.methods.setRequiredTribute(accounts[8], 200, false, true).send({from: accounts[0]});
        
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

        try {
            let tx = await MessageTribute.methods.requestAudience(accounts[0]).send({from: accounts[8]});
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
        
        let tx = await MessageTribute.methods.requestAudience(accounts[0]).send({from: accounts[8]});
    
        assert.notEqual(tx.events.AudienceRequested, undefined, "AudienceRequested wasn't triggered");
    });


    it("Requesting tribute from specific account", async() => {
        await MessageTribute.methods.setRequiredTribute(accounts[7], 100, true, true).send({from: accounts[0]});
        
        await SNT.methods.approve(MessageTribute.address, 200).send({from: accounts[7]});
        await MessageTribute.methods.deposit(200).send({from: accounts[7]});

        assert.equal(
            await MessageTribute.methods.balance().call({from: accounts[7]}),
            200,
            "Deposited balance must be 200"); 

        let tx = await MessageTribute.methods.requestAudience(accounts[0]).send({from: accounts[7]});

        assert.notEqual(tx.events.AudienceRequested, undefined, "AudienceRequested wasn't triggered");
    
        assert.equal(
            await MessageTribute.methods.balance().call({from: accounts[7]}),
            100,
            "Deposited balance must be 100"); 
     });

     it("Cancelling an audience", async() => {
        
        assert.equal(
            await MessageTribute.methods.hasPendingAudience(accounts[0]).call({from: accounts[8]}),
            true,
            "Must have a pending audience");

        // TODO update EVM time and mine one block to test this

        // This commented code works. Needs the previous TODO to uncomment it
        /*let tx = await MessageTribute.methods.cancelAudienceRequest(accounts[0]).send({from: accounts[8]});

        assert.notEqual(tx.events.AudienceCancelled, undefined, "AudienceCancelled wasn't triggered");

        assert.equal(
            await MessageTribute.methods.hasPendingAudience(accounts[0]).call({from: accounts[8]}),
            false,
            "Must not have a pending audience");*/

     });

     it("Cancelling an audience without having one", async() => {
        assert.equal(
            await MessageTribute.methods.hasPendingAudience(accounts[0]).call({from: accounts[6]}),
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
        let amount = (await MessageTribute.methods.getRequiredFee(accounts[0]).call({from: accounts[7]})).fee.toString();
     
        assert.equal(
            await MessageTribute.methods.hasPendingAudience(accounts[0]).call({from: accounts[7]}),
            true,
            "Must have a pending audience");

        let tx = await MessageTribute.methods.grantAudience(accounts[7], true).send({from: accounts[0]});

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
            await MessageTribute.methods.hasPendingAudience(accounts[0]).call({from: accounts[7]}),
            false,
            "Must not have a pending audience");
     });

     it("Denying an audience", async() => {

        let amount = (await MessageTribute.methods.getRequiredFee(accounts[0]).call({from: accounts[7]})).fee.toString();

        let initial7DepBalance = (await MessageTribute.methods.balance().call({from: accounts[7]})).toString();

        let tx = await MessageTribute.methods.requestAudience(accounts[0]).send({from: accounts[7]});

        let afterReq7DepBalance = (await MessageTribute.methods.balance().call({from: accounts[7]})).toString();
        
        assert.equal(
            afterReq7DepBalance,
            web3.utils.toBN(initial7DepBalance).sub(web3.utils.toBN(amount)).toString(),
            accounts[7] + "SNT deposit balance error");

        assert.notEqual(tx.events.AudienceRequested, undefined, "AudienceRequested wasn't triggered");
    
        let tx2 = await MessageTribute.methods.grantAudience(accounts[7], false).send({from: accounts[0]});

        assert.notEqual(tx2.events.AudienceGranted, undefined, "AudienceGranted wasn't triggered");

        let afterDeny7DepBalance = (await MessageTribute.methods.balance().call({from: accounts[7]})).toString();
        
        assert.equal(
            initial7DepBalance,
            afterDeny7DepBalance,
            accounts[7] + "SNT deposit balance error");

        assert.equal(
                await MessageTribute.methods.hasPendingAudience(accounts[0]).call({from: accounts[7]}),
                false,
                "Must not have a pending audience");
     });
     
     it("Requesting a non permanent tribute from specific account", async() => {
        await MessageTribute.methods.setRequiredTribute(accounts[6], 100, true, false).send({from: accounts[0]});
        let amount1 = (await MessageTribute.methods.getRequiredFee(accounts[0]).call({from: accounts[6]})).fee.toString();
        
        await SNT.methods.approve(MessageTribute.address, 200).send({from: accounts[6]});
        await MessageTribute.methods.deposit(200).send({from: accounts[6]});

        let tx = await MessageTribute.methods.requestAudience(accounts[0]).send({from: accounts[6]});
    
        assert.notEqual(tx.events.AudienceRequested, undefined, "AudienceRequested wasn't triggered");
    
        assert.equal(
            await MessageTribute.methods.balance().call({from: accounts[6]}),
            100,
            "Deposited balance must be 100"); 

        let tx2 = await MessageTribute.methods.grantAudience(accounts[6], false).send({from: accounts[0]});
        assert.notEqual(tx2.events.AudienceGranted, undefined, "AudienceGranted wasn't triggered");

        let amount = (await MessageTribute.methods.getRequiredFee(accounts[0]).call({from: accounts[6]})).fee.toString();
        
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