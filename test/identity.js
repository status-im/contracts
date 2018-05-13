
const TestUtils = require("../utils/testUtils.js");
const idUtils = require('../utils/identityUtils.js');

describe("Identity", function() {
    this.timeout(0);

    let accounts;

    beforeEach( function(done) {
        this.timeout(0);
        
        EmbarkSpec = Embark.initTests();
        web3 = EmbarkSpec.web3;

        EmbarkSpec.deployAll({ 
                "Identity": {},
                "TestContract": {}
            }, (_accounts) => { 
            accounts = _accounts;  
            done();          
        });
    });

    describe("Identity()", () => {
        it("initialize with msg.sender as management key", async () => {
            assert.equal(
                await Identity.methods.getKeyPurpose(TestUtils.addressToBytes32(accounts[0])).call(),
                idUtils.purposes.MANAGEMENT,
                Identity.address + ".getKeyPurpose("+accounts[0]+") is not MANAGEMENT_KEY");

        });
    });


    describe("addKey(address _key, uint256 _type)", () => {
        it("MANAGEMENT_KEY add a new address as ACTION_KEY", async () => {
            await Identity.methods.execute(
                Identity.address, 
                0, 
                idUtils.encode.addKey(accounts[1], idUtils.purposes.ACTION, idUtils.types.ADDRESS)
            ).send({from: accounts[0]});

            assert.equal(
                await Identity.methods.getKeyPurpose(TestUtils.addressToBytes32(accounts[1])).call(),
                idUtils.purposes.ACTION,
                Identity.address+".getKeyPurpose("+accounts[1]+") is not ACTION_KEY");
        });

        it("should not add key by non manager", async () => {            
            try {
                await Identity.methods.execute(
                    Identity.address, 
                    0, 
                    idUtils.encode.addKey(accounts[1], idUtils.purposes.MANAGEMENT, idUtils.types.ADDRESS))
                    .send({from: accounts[2]});
                assert.fail('should have reverted before');
            } catch(error) {
                TestUtils.assertJump(error);
            }
            
            assert.equal(
                await Identity.methods.getKeyPurpose(TestUtils.addressToBytes32(accounts[1])).call(),
                idUtils.purposes.NONE,
                Identity.address+".getKeyPurpose("+accounts[1]+") is not correct");

        });

        it("should not add key type 1 by actor", async () => {  
            await Identity.methods.execute(
                Identity.address, 
                0, 
                idUtils.encode.addKey(accounts[2], idUtils.purposes.ACTION, idUtils.types.ADDRESS))
                .send({from: accounts[0]});
            
            try {
                await Identity.methods.execute(
                    Identity.address, 
                    0, 
                    idUtils.encode.addKey(accounts[1], idUtils.purposes.MANAGEMENT, idUtils.types.ADDRESS))
                    .send({from: accounts[2]});
                assert.fail('should have reverted before');
            } catch(error) {
                TestUtils.assertJump(error);
            }
                
            assert.equal(
                await Identity.methods.getKeyPurpose(TestUtils.addressToBytes32(accounts[1])).call(),
                idUtils.purposes.NONE,
                Identity.address+".getKeyType("+accounts[1]+") is not correct");
        });

        it("fire KeyAdded(address indexed key, uint256 indexed type)", async () => {
            let receipt = await Identity.methods.execute(
                Identity.address, 
                0, 
                idUtils.encode.addKey(accounts[1], idUtils.purposes.MANAGEMENT, idUtils.types.ADDRESS))
            .send({from: accounts[0]});
            
            const keyAdded = TestUtils.eventValues(receipt, "KeyAdded");
            assert(keyAdded.key, TestUtils.addressToBytes32(accounts[1]), "Key is not correct")
            assert(keyAdded.keyType, idUtils.types.ADDRESS, "Type is not correct")
        });
    });


    describe("removeKey(address _key, uint256 _type)", () => {
        it("MANAGEMENT_KEY should remove a key", async () => {
            await Identity.methods.execute(
                Identity.address, 
                0, 
                idUtils.encode.addKey(accounts[1], idUtils.purposes.MANAGEMENT, idUtils.types.ADDRESS)) 
                .send({from: accounts[0]});

            await Identity.methods.execute(
                Identity.address, 
                0, 
                idUtils.encode.removeKey(accounts[1], idUtils.purposes.MANAGEMENT))
                .send({from: accounts[0]});
            
            assert.equal(
                await Identity.methods.getKeyPurpose(TestUtils.addressToBytes32(accounts[1])).call(),
                idUtils.purposes.NONE,
                Identity.address+".getKeyPurpose("+accounts[1]+") is not 0")
        });

        it("other key should not remove a key", async () => {
            await Identity.methods.execute(
                Identity.address, 
                0, 
                idUtils.encode.addKey(accounts[1], idUtils.purposes.MANAGEMENT, idUtils.types.ADDRESS))
                .send({from: accounts[0]});

            try {
                await Identity.methods.execute(
                    Identity.address, 
                    0, 
                    idUtils.encode.removeKey(accounts[1], idUtils.purposes.MANAGEMENT))
                    .send({from: accounts[2]});
                assert.fail('should have reverted before');
            } catch(error) {
                TestUtils.assertJump(error);
            }
            
            assert.equal(
                await Identity.methods.getKeyPurpose(TestUtils.addressToBytes32(accounts[1])).call(),
                idUtils.purposes.MANAGEMENT,
                Identity.address+".getKeyPurpose("+accounts[1]+") is not 0")
        });

        it("actor key should not remove key", async () => {
            await Identity.methods.execute(
                Identity.address, 
                0, 
                idUtils.encode.addKey(accounts[1], idUtils.purposes.ACTION, idUtils.types.ADDRESS))
                .send({from: accounts[0]});

            await Identity.methods.execute(
                Identity.address, 
                0, 
                idUtils.encode.addKey(accounts[2], idUtils.purposes.ACTION, idUtils.types.ADDRESS)) 
                .send({from: accounts[0]});

            try {
                await Identity.methods.execute(
                    Identity.address, 
                    0, 
                    idUtils.encode.removeKey(accounts[1], idUtils.purposes.ACTION))
                    .send({from: accounts[2]});

                assert.fail('should have reverted before');
            } catch(error) {
                TestUtils.assertJump(error);
            }

            assert.equal(
                await Identity.methods.getKeyPurpose(TestUtils.addressToBytes32(accounts[1])).call(),
                idUtils.purposes.ACTION,
                Identity.address+".getKeyType("+accounts[1]+") is not 0")
        });
        
        it("MANAGEMENT_KEY should not remove itself MANAGEMENT_KEY when there is no other MANAGEMENT_KEY", async () => {
            await Identity.methods.execute(
                Identity.address, 
                0, 
                idUtils.encode.removeKey(accounts[0], idUtils.purposes.MANAGEMENT))
                .send({from: accounts[0]});

            assert.equal(
                await Identity.methods.getKeyPurpose(TestUtils.addressToBytes32(accounts[0])).call(),
                idUtils.purposes.MANAGEMENT,
                Identity.address+".getKeyType("+accounts[0]+") is not 1")
        });

        it("fire KeyRemoved(address indexed key, uint256 indexed type)", async () => {
            await Identity.methods.execute(
                Identity.address, 
                0, 
                idUtils.encode.addKey(accounts[1], idUtils.purposes.ACTION, idUtils.types.ADDRESS))
                .send({from: accounts[0]});
            
            let receipt = await Identity.methods.execute(
                Identity.address, 
                0, 
                idUtils.encode.removeKey(accounts[1], idUtils.purposes.ACTION))
                .send({from: accounts[0]});

            const keyRemoved = TestUtils.eventValues(receipt, "KeyRemoved");
            assert(keyRemoved.key, TestUtils.addressToBytes32(accounts[1]), "Key is not correct");
            assert(keyRemoved.keyType, idUtils.types.ADDRESS, "Type is not correct");
        });
    });


    describe("getKeyPurpose(address _key)", () => {

        it("should start only with initializer as only key", async () => {
            assert.equal(
                await Identity.methods.getKeyPurpose(TestUtils.addressToBytes32(accounts[0])).call(),
                idUtils.purposes.MANAGEMENT,
                Identity.address+".getKeyPurpose("+accounts[0]+") is not correct")

            assert.equal(
                await Identity.methods.getKeyPurpose(TestUtils.addressToBytes32(accounts[1])).call(),
                idUtils.purposes.NONE,
                Identity.address+".getKeyPurpose("+accounts[1]+") is not correct")
        });

        it("should get type 2 after addKey type 2", async () => {
            await Identity.methods.execute(
                Identity.address, 
                0, 
                idUtils.encode.addKey(accounts[1], idUtils.purposes.ACTION, idUtils.types.ADDRESS))
                .send({from: accounts[0]});
            
            assert.equal(
                await Identity.methods.getKeyPurpose(TestUtils.addressToBytes32(accounts[1])).call(),
                idUtils.purposes.ACTION,
                Identity.address+".getKeyPurpose("+accounts[1]+") is not correct")
            });
            
        it("should get type 3 after addKey type 3", async () => {       
            await Identity.methods.execute(
                Identity.address, 
                0, 
                idUtils.encode.addKey(accounts[1], idUtils.purposes.CLAIM_SIGNER, idUtils.types.ADDRESS))
                .send({from: accounts[0]});

            assert.equal(
                await Identity.methods.getKeyPurpose(TestUtils.addressToBytes32(accounts[1])).call(),
                idUtils.purposes.CLAIM_SIGNER,
                Identity.address+".getKeyPurpose("+accounts[1]+") is not correct")
        });

    });

   /*
    describe("getKeysByType(uint256 _type)", () => {

        it("at initialization", async () => {
            
        });

        it("after addKey", async () => {
            
        });

        it("after removeKey", async () => {
            
        });
    });
    */

    describe("execute(address _to, uint256 _value, bytes _data)", () => {
        let functionPayload;

        it("Identity should receive ether", async() => {

            const amountToSend = web3.utils.toWei('0.05', "ether");

            let idBalance0 = await web3.eth.getBalance(Identity.address);

            await web3.eth.sendTransaction({from:accounts[0], to:Identity.address, value: amountToSend}) 

            let idBalance1 = await web3.eth.getBalance(Identity.address);

            assert.equal(web3.utils.toBN(idBalance0).add(web3.utils.toBN(amountToSend)).toString(), web3.utils.toBN(idBalance1).toString(), Identity.address + " did not receive ether");
        });

        it("ACTOR_KEY execute arbitrary transaction", async () => {
            await Identity.methods.execute(
                Identity.address, 
                0, 
                idUtils.encode.addKey(accounts[1], idUtils.purposes.ACTION, idUtils.types.ADDRESS))
                .send({from: accounts[0]});

            
            functionPayload = web3.eth.abi.encodeFunctionCall({
                name: 'test',
                type: 'function',
                inputs: []
            }, []);

            let receipt = await Identity.methods.execute(
                TestContract.address, 
                0, 
                functionPayload)
                .send({from: accounts[1]});

            // @rramos - Commented because of error:
            // The current provider doesn't support subscriptions: Provider
            /*assert.notEqual(
                await TestUtils.listenForEvent(TestContract.events.TestFunctionExecuted),
                undefined,
                "Test function was not executed");  */
           
        });
        
        it("MANAGEMENT_KEY cannot execute arbitrary transaction", async () => {
            try {
                await Identity.methods.execute(
                    TestContract.address, 
                    0, 
                    functionPayload)
                    .send({from: accounts[0]});
            } catch(error) {
                TestUtils.assertJump(error);
            }
        });

        it("Other keys NOT execute arbitrary transaction", async () => {
            try {
                await Identity.methods.execute(
                    TestContract.address, 
                    0, 
                    functionPayload)
                    .send({from: accounts[3]});
                assert.fail('should have reverted before');
            } catch(error) {
                TestUtils.assertJump(error);
            }
        });


        it("ACTION_KEY should send ether from contract", async () => {
            await Identity.methods.execute(
                Identity.address, 
                0, 
                idUtils.encode.addKey(accounts[1], idUtils.purposes.ACTION, idUtils.types.ADDRESS))
                .send({from: accounts[0]});

            // Adding funds to contract
            await web3.eth.sendTransaction({from:accounts[0], to:Identity.address, value: web3.utils.toWei('0.05', "ether")}) 

            const amountToSend = web3.utils.toWei('0.01', "ether");

            let idBalance0 = await web3.eth.getBalance(Identity.address);
            let a2Balance0 = await web3.eth.getBalance(accounts[2]);

            await Identity.methods.execute(
                accounts[2], 
                amountToSend, 
                '0x')
                .send({from: accounts[1]});

            let idBalance1 = await web3.eth.getBalance(Identity.address);
            let a2Balance1 = await web3.eth.getBalance(accounts[2]);

            assert(web3.utils.toBN(idBalance1).toString(), web3.utils.toBN(idBalance0).sub(web3.utils.toBN(amountToSend)).toString(), "Contract did not send ether");
            assert(web3.utils.toBN(a2Balance1).toString(), web3.utils.toBN(a2Balance0).add(web3.utils.toBN(amountToSend)).toString(), accounts[2] + " did not receive ether");
        });

        it("fire ExecutionRequested(uint256 indexed executionId, address indexed to, uint256 indexed value, bytes data)", async () => {
            await Identity.methods.execute(
                Identity.address, 
                0, 
                idUtils.encode.addKey(accounts[1], idUtils.purposes.ACTION, idUtils.types.ADDRESS))
                .send({from: accounts[0]});
            
            let receipt = await Identity.methods.execute(
                TestContract.address, 
                0, 
                functionPayload)
                .send({from: accounts[1]});

            const executionRequested = TestUtils.eventValues(receipt, "ExecutionRequested");
            assert(executionRequested.to, TestContract.address, "To is not correct");
            assert(executionRequested.value, 0, "Value is not correct");
            assert(executionRequested.data, functionPayload, "Data is not correct");
        });

        it("fire Executed(uint256 indexed executionId, address indexed to, uint256 indexed value, bytes data)", async () => {
            await Identity.methods.execute(
                Identity.address, 
                0, 
                idUtils.encode.addKey(accounts[1], idUtils.purposes.ACTION, idUtils.types.ADDRESS))
                .send({from: accounts[0]});
            
            let receipt = await Identity.methods.execute(
                TestContract.address, 
                0, 
                functionPayload)
                .send({from: accounts[1]});
            
            const executed = TestUtils.eventValues(receipt, "Executed")
            assert(executed.to, TestContract.address, "To is not correct");
            assert(executed.value, 0, "Value is not correct");
            assert(executed.data, functionPayload, "Data is not correct");
        });
    });


    /*
    describe("setMinimumApprovalsByKeyPurpose(uint256 _type, uint8 _minimumApprovals)", () => {
        it("MANAGEMENT_KEY should set minimum approvals for MANAGEMENT_KEYs", async () => {
            
        });

        it("MANAGEMENT_KEY should set minimum approvals for ACTION_KEYs", async () => {
            
        });

        it("ACTION_KEY should not be able to set minimum approvals", async () => {
            
        });

        it("Other keys should not be able to set minimum approvals", async () => {
            
        });
    });

    describe("approve(bytes32 _id, bool _approve)", () => {

        it("MANAGEMENT_KEY should approve a claim", async () => {
            
        });

        it("MANAGEMENT_KEY should approve a transaction", async () => {
            
        });

        it("2 out of 3 MANAGEMENT_KEY should approve a transaction and execute it", async () => {
            
        });

        it("fire Approved(uint256 indexed executionId, bool approved)", async () => {
            
        });

    });

    
    describe("getClaim(bytes32 _claimId)", () => {

        it("Returns a claim by ID.", async () => {
            
        });

    });
            
    describe("getClaimIdsByType(uint256 _claimType)", () => {
        it("Returns an array of claim IDs by type.", async () => {
            
        });
    });
                        
    describe("addClaim(uint256 _claimType, address issuer, uint256 signatureType, bytes _signature, bytes _data, string _uri)", () => {
        it("Requests the ADDITION of a claim from an issuer", async () => {
            
        });

        it("Requests the CHANGE of a claim from an issuer", async () => {
            
        });

    });

    describe("removeClaim(bytes32 _claimId)", () => {
        it("Requests the DELETION of a claim from an issuer", async () => {
            
        });

        it("Requests the DELETION of a claim from identity", async () => {
            
        });
    });
    */


});



