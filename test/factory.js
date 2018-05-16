const TestUtils = require("../utils/testUtils.js")
const idUtils = require("../utils/identityUtils.js")

describe('IdentityFactory', function(accounts) {

    let identityFactory;
    let identity;
    let updatedIdentity;
    let updatedIdentityKernel;

    before( function(done) {
        this.timeout(0);
        
        EmbarkSpec = Embark.initTests();
        web3 = EmbarkSpec.web3;

        EmbarkSpec.deployAll({
            "IdentityFactory": {
                args: ["0xaaaa"],
                gas: 5000000
            },
            "Identity": {},
            "UpdatedIdentityKernel": {}
        }, (_accounts) => { 
            accounts = _accounts;  
            done();          
        });
    });


    it("Creates a new identity", async () => {
        let tx = await IdentityFactory.methods.createIdentity().send({from: accounts[0]});

        const logEntry = tx.events.IdentityCreated;

        assert(logEntry !== undefined, "IdentityCreated was not triggered");

        let identity = new web3.eth.Contract(identityJson.abi, logEntry.returnValues.instance, {from: accounts[0]});
        
        assert.equal(
            await identity.methods.getKeyPurpose(TestUtils.addressToBytes32(accounts[0])).call(),
            idUtils.purposes.MANAGEMENT,
            identity.address + ".getKeyPurpose("+accounts[0]+") is not MANAGEMENT_KEY")
    });


    it("Registers a updated identity contract", async() => {
        const infoHash = "0xbbbb";
        let receipt = await IdentityFactory.methods.setKernel(UpdatedIdentityKernel.address, infoHash).send({from: accounts[0]});
        
        const newKernel = TestUtils.eventValues(receipt, "NewKernel");
        assert(newKernel.infohash, infoHash, "Infohash is not correct");
    });

    
    it("Creates a new identity using latest version", async() => {
        let tx = await IdentityFactory.methods.createIdentity().send({from: accounts[0]});

        assert.notEqual(tx.events.IdentityCreated, undefined, "IdentityCreated wasn't triggered");

        const contractAddress = tx.events.IdentityCreated.returnValues.instance;

        
        let updatedIdentity = new web3.eth.Contract(updatedIdentityKernelJson.abi, contractAddress, {from: accounts[0]});
        
        tx = await updatedIdentity.methods.test().send({from: accounts[0]});
        assert.notEqual(tx.events.TestFunctionExecuted, undefined, "TestFunctionExecuted wasn't triggered");
        
        // Test if it still executes identity functions as expected
        let baseIdentity = new web3.eth.Contract(identityJson.abi, contractAddress, {from: accounts[0]});
        
        assert.equal(
            await baseIdentity.methods.getKeyPurpose(TestUtils.addressToBytes32(accounts[0])).call(),
            1,
            baseIdentity.address + ".getKeyPurpose("+accounts[0]+") is not MANAGEMENT_KEY")
    });


    it("Updates an identity to the latest version", async() => {
        let tx1 = await Identity.methods.execute(
            Identity.address, 
            0, 
            idUtils.encode.updateRequestUpdatableInstance(UpdatedIdentityKernel.address))
            .send({from: accounts[0]});

        assert.notEqual(tx1.events.Executed, undefined, "Executed wasn't triggered");

        // Updating EVM timestamp to test delay
        const plus31days = 60 * 60 * 24 * 31;

        /*
        // @rramos - The following code is supposed to increase by 31 days the evm date,
        // and mine one block. It is commented because it seems to not be working on web3 1.0.
        // Also, sendAsync is supposed to be named send in this version, yet it shows an error
        // that it does not support synchronous executions. (?)
        // TODO: figure it out!

        web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [plus31days], id: 0}, function(){console.log(1);});
        web3.currentProvider.send({jsonrpc: "2.0", method: "evm_mine", params: [], id: 0}, function(){console.log(2);})
        

        
        // Confirm update
        let tx2 = await Identity.methods.execute(
            Identity.address, 
            0, 
            idUtils.encode.updateConfirmUpdatableInstance(UpdatedIdentityKernel.address))
            .send({from: accounts[0]});

        assert.notEqual(tx2.events.Executed, undefined, "Executed wasn't triggered");


        let updatedIdentity1 = new web3.eth.Contract(updatedIdentityKernelJson.abi, Identity.address, {from: accounts[0]});
      
        // Calling 
        let tx3 = await updatedIdentity1.methods.test().send({from: accounts[0]});
        assert.notEqual(tx3.events.TestFunctionExecuted, undefined, "TestFunctionExecuted wasn't triggered");
        assert.equal(
            tx3.events.TestFunctionExecuted.returnValues.minApprovalsByManagementKeys.toString(10),
            1,
            Identity.address + " wasn't updated to last version");
        
        */
    })
    

});

