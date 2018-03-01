const TestUtils = require("../utils/testUtils.js")
const web3EthAbi = require("web3-eth-abi");
const idUtils = require('../utils/identityUtils.js');

const Identity = artifacts.require("./identity/Identity.sol");

contract('Identity', function(accounts) {

    let identity;

    beforeEach(async () => {
        identity = await Identity.new({from: accounts[0]})
    })

    describe("Identity()", () => {
        it("initialize with msg.sender as management key", async () => {
            assert.equal(
                await identity.getKeyPurpose(TestUtils.addressToBytes32(accounts[0])),
                idUtils.purposes.MANAGEMENT,
                identity.address + ".getKeyPurpose("+accounts[0]+") is not MANAGEMENT_KEY")
        });
    });


    describe("addKey(address _key, uint256 _type)", () => {
        it("MANAGEMENT_KEY add a new address as ACTION_KEY", async () => {
            await identity.execute(
                identity.address, 
                0, 
                idUtils.encode.addKey(accounts[1], idUtils.purposes.ACTION, idUtils.types.ADDRESS),
                {from: accounts[0]}
            );

            assert.equal(
                await identity.getKeyPurpose(TestUtils.addressToBytes32(accounts[1])),
                idUtils.purposes.ACTION,
                identity.address+".getKeyPurpose("+accounts[1]+") is not ACTION_KEY")
        });

        it("should not add key by non manager", async () => {            
            try {
                await identity.execute(
                    identity.address, 
                    0, 
                    idUtils.encode.addKey(accounts[1], idUtils.purposes.MANAGEMENT, idUtils.types.ADDRESS), 
                    {from: accounts[2]}
                );
                assert.fail('should have reverted before');
            } catch(error) {
                TestUtils.assertJump(error);
            }
            
            assert.equal(
                await identity.getKeyPurpose(TestUtils.addressToBytes32(accounts[1])),
                idUtils.purposes.NONE,
                identity.address+".getKeyPurpose("+accounts[1]+") is not correct")
        });

        it("should not add key type 1 by actor", async () => {  
            await identity.execute(
                identity.address, 
                0, 
                idUtils.encode.addKey(accounts[2], idUtils.purposes.ACTION, idUtils.types.ADDRESS), 
                {from: accounts[0]}
            );
            
            await identity.execute(
                identity.address, 
                0, 
                idUtils.encode.addKey(accounts[1], idUtils.purposes.MANAGEMENT, idUtils.types.ADDRESS), 
                {from: accounts[2]}
            );
                
            assert.equal(
                await identity.getKeyPurpose(TestUtils.addressToBytes32(accounts[1])),
                idUtils.purposes.NONE,
                identity.address+".getKeyType("+accounts[1]+") is not correct")
        });

        it("fire KeyAdded(address indexed key, uint256 indexed type)", async () => {
            await identity.execute(
                identity.address, 
                0, 
                idUtils.encode.addKey(accounts[1], idUtils.purposes.MANAGEMENT, idUtils.types.ADDRESS), 
                {from: accounts[0]}
            );
            
            const keyAdded = await TestUtils.listenForEvent(identity.KeyAdded())
            assert(keyAdded.key, TestUtils.addressToBytes32(accounts[1]), "Key is not correct")
            assert(keyAdded.keyType, idUtils.types.ADDRESS, "Type is not correct")
        });
    });


    describe("removeKey(address _key, uint256 _type)", () => {
        it("MANAGEMENT_KEY should remove a key", async () => {
            await identity.execute(
                identity.address, 
                0, 
                idUtils.encode.addKey(accounts[1], idUtils.purposes.MANAGEMENT, idUtils.types.ADDRESS), 
                {from: accounts[0]}
            );

            await identity.execute(
                identity.address, 
                0, 
                idUtils.encode.removeKey(accounts[1], idUtils.purposes.MANAGEMENT), 
                {from: accounts[0]}
            );
            
            assert.equal(
                await identity.getKeyPurpose(TestUtils.addressToBytes32(accounts[1])),
                idUtils.purposes.NONE,
                identity.address+".getKeyPurpose("+accounts[1]+") is not 0")
        });

        it("other key should not removes a key", async () => {
            await identity.execute(
                identity.address, 
                0, 
                idUtils.encode.addKey(accounts[1], idUtils.purposes.MANAGEMENT, idUtils.types.ADDRESS), 
                {from: accounts[0]}
            );

            try {
                await identity.execute(
                    identity.address, 
                    0, 
                    idUtils.encode.removeKey(accounts[1], idUtils.purposes.MANAGEMENT), 
                    {from: accounts[2]}
                );
                assert.fail('should have reverted before');
            } catch(error) {
                TestUtils.assertJump(error);
            }
            
            assert.equal(
                await identity.getKeyPurpose(TestUtils.addressToBytes32(accounts[1])),
                idUtils.purposes.MANAGEMENT,
                identity.address+".getKeyPurpose("+accounts[1]+") is not 0")
        });

        it("actor key should not remove key", async () => {
            await identity.execute(
                identity.address, 
                0, 
                idUtils.encode.addKey(accounts[1], idUtils.purposes.ACTION, idUtils.types.ADDRESS), 
                {from: accounts[0]}
            );

            await identity.execute(
                identity.address, 
                0, 
                idUtils.encode.addKey(accounts[2], idUtils.purposes.ACTION, idUtils.types.ADDRESS), 
                {from: accounts[0]}
            );

            await identity.execute(
                identity.address, 
                0, 
                idUtils.encode.removeKey(accounts[1], idUtils.purposes.ACTION), 
                {from: accounts[2]}
            );

            assert.equal(
                await identity.getKeyPurpose(TestUtils.addressToBytes32(accounts[1])),
                idUtils.purposes.ACTION,
                identity.address+".getKeyType("+accounts[1]+") is not 0")
        });
        
        it("MANAGEMENT_KEY should not remove itself MANAGEMENT_KEY when there is no other MANAGEMENT_KEY", async () => {
            await identity.execute(
                identity.address, 
                0, 
                idUtils.encode.removeKey(accounts[0], idUtils.purposes.MANAGEMENT), 
                {from: accounts[0]}
            );

            assert.equal(
                await identity.getKeyPurpose(TestUtils.addressToBytes32(accounts[0])),
                idUtils.purposes.MANAGEMENT,
                identity.address+".getKeyType("+accounts[0]+") is not 1")
        });

        it("fire KeyRemoved(address indexed key, uint256 indexed type)", async () => {
            await identity.execute(
                identity.address, 
                0, 
                idUtils.encode.addKey(accounts[1], idUtils.purposes.ACTION, idUtils.types.ADDRESS), 
                {from: accounts[0]}
            );
            
            await identity.execute(
                identity.address, 
                0, 
                idUtils.encode.removeKey(accounts[1], idUtils.purposes.ACTION), 
                {from: accounts[0]}
            );

            const keyRemoved = await TestUtils.listenForEvent(identity.KeyRemoved());
            assert(keyRemoved.key, TestUtils.addressToBytes32(accounts[1]), "Key is not correct");
            assert(keyRemoved.keyType, idUtils.types.ADDRESS, "Type is not correct");
        });
    });



    /*
    describe("getKeyPurpose(address _key)", () => {

        it("should start only with initializer as only key", async () => {
            assert.equal(
                await identity.getKeyPurpose(TestUtils.addressToBytes32(accounts[0])),
                1,
                identity.address+".getKeyPurpose("+accounts[0]+") is not correct")

            assert.equal(
                await identity.getKeyPurpose(TestUtils.addressToBytes32(accounts[1])),
                0,
                identity.address+".getKeyPurpose("+accounts[1]+") is not correct")
        });

        it("should get type 2 after addKey type 2", async () => {
            await identity.addKey(TestUtils.addressToBytes32(accounts[1]), 2, 1, {from: accounts[0]})
            assert.equal(
                await identity.getKeyPurpose(TestUtils.addressToBytes32(accounts[1])),
                2,
                identity.address+".getKeyPurpose("+accounts[1]+") is not correct")
            });
            
        it("should get type 3 after addKey type 3", async () => {            
            await identity.addKey(TestUtils.addressToBytes32(accounts[1]), 3, 1, {from: accounts[0]})
            assert.equal(
                await identity.getKeyPurpose(TestUtils.addressToBytes32(accounts[1])),
                3,
                identity.address+".getKeyPurpose("+accounts[1]+") is not correct")
        });

    });

   
    describe("getKeysByType(uint256 _type)", () => {

        it("at initialization", async () => {
            
        });

        it("after addKey", async () => {
            
        });

        it("after removeKey", async () => {
            
        });

        it("after replaceKey", async () => {
            
        });

    });



    describe("execute(address _to, uint256 _value, bytes _data)", () => {

        it("ACTOR_KEY execute arbitrary transaction", async () => {
            
        });
        
        it("MANAGEMENT_KEY execute arbitrary transaction", async () => {
            
        });

        it("Other keys NOT execute arbitrary transaction", async () => {
            
        });

        it("fire Executed(uint256 indexed executionId, address indexed to, uint256 indexed value, bytes data)", async () => {
            
        });

    });


    describe("approve(bytes32 _id, bool _approve)", () => {

        it("MANAGEMENT_KEY should approve a claim", async () => {
            
        });

        it("MANAGEMENT_KEY should approve a transaction", async () => {
            
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
