const assert = require('assert');
const Embark = require('embark');
let EmbarkSpec = Embark.initTests();
let web3 = EmbarkSpec.web3;

const TestUtils = require("../utils/testUtils.js")
const idUtils = require("../utils/identityUtils.js")
const web3EthAbi = require("web3-eth-abi");

describe('IdentityFactory', function(accounts) {

    let identityFactory;
    let identity;
    let updatedIdentity;
    let updatedIdentityKernel;

    before( function(done) {
        this.timeout(0);
        
        EmbarkSpec = Embark.initTests();
        web3 = EmbarkSpec.web3;

        // @rramos - this fails
        EmbarkSpec.deployAll({
            "IdentityFactory": {
                args: ["0xaaa"]
            }
        }, (_accounts) => { 
            accounts = _accounts;  
   
            done();          
        });
    });


    it("Creates a new identity", async () => {
        let tx = await IdentityFactory.methods.createIdentity({from: accounts[0]});
        const logEntry = tx.logs[0];
        assert.strictEqual(logEntry.event, "IdentityCreated");
        identity = await Identity.at(logEntry.args.instance, {from: accounts[0]})
        
        assert.equal(
            await identity.getKeyPurpose(TestUtils.addressToBytes32(accounts[0])),
            idUtils.purposes.MANAGEMENT,
            identity.address + ".getKeyPurpose("+accounts[0]+") is not MANAGEMENT_KEY")
    });


    it("Registers a updated identity contract", async() => {
        const infoHash = "0xbbb";
        updatedIdentityKernel = await UpdatedIdentityKernel.new({from: accounts[0]});
        await identityFactory.setKernel(updatedIdentityKernel.address, infoHash);
        
        const newKernel = await TestUtils.listenForEvent(identityFactory.NewKernel());
        assert(newKernel.infohash, infoHash, "Infohash is not correct");
    });

    
    it("Creates a new identity using latest version", async() => {
        let tx = await identityFactory.createIdentity({from: accounts[0]});
        const logEntry = tx.logs[0];
        assert.strictEqual(logEntry.event, "IdentityCreated");

        updatedIdentity = await UpdatedIdentityKernel.at(logEntry.args.instance, {from: accounts[0]})
        tx = await updatedIdentity.test({from: accounts[0]});
        assert.strictEqual(tx.logs[0].event, "TestFunctionExecuted");
        
        // Test if it still executes identity functions as expected
        let baseIdentity = await Identity.at(updatedIdentity.address, {from: accounts[0]})
        assert.equal(
            await identity.getKeyPurpose(TestUtils.addressToBytes32(accounts[0])),
            1,
            identity.address + ".getKeyPurpose("+accounts[0]+") is not MANAGEMENT_KEY")
    });


    it("Updates an identity to the latest version", async() => {
        let tx1 = await identity.execute(
            identity.address, 
            0, 
            idUtils.encode.updateUpdatableInstance(updatedIdentityKernel.address), 
            {from: accounts[0]} 
        );
        assert.strictEqual(tx1.logs[tx1.logs.length - 1].event, "Executed");

        // Calling function available in updated identity kernel
        let updatedIdentity1 = await UpdatedIdentityKernel.at(identity.address, {from: accounts[0]})
        let tx2 = await updatedIdentity1.test({from: accounts[0]});

        assert.strictEqual(tx2.logs[tx2.logs.length - 1].event, "TestFunctionExecuted");
        assert.equal(
            tx2.logs[tx2.logs.length - 1].args.minApprovalsByManagementKeys.toString(10),
            1,
            identity.address + " wasn't updated to last version");
    });
    

});

