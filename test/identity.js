const TestUtils = require("./TestUtils.js")
const Identity = artifacts.require("./Identity.sol");

contract('Identity', function(accounts) {

    let identity;
    beforeEach(async () => {
        identity = await Identity.new({from: accounts[0]})
    })


    describe("Identity()", () => {

        it("initialize with msg.sender as management key", async () => {
            assert.equal(
                await identity.getKeyType(accounts[0]),
                1,
                identity.address+".getKeyType("+accounts[0]+") is not MANAGEMENT_KEY")
        });
        
    });


    describe("addKey(address _key, uint256 _type)", () => {

        it("MANAGEMENT_KEY add a new address as ACTION_KEY", async () => {
            await identity.addKey(accounts[1], 2, {from: accounts[0]})
            assert.equal(
                await identity.getKeyType(accounts[1]),
                2,
                identity.address+".getKeyType("+accounts[1]+") is not ACTION_KEY")
        });


        it("should not add key by non manager", async () => {            
            try {
                await identity.addKey(accounts[1], 1, {from: accounts[2]})
            }catch(e){
            }
            assert.equal(
                await identity.getKeyType(accounts[1]),
                0,
                identity.address+".getKeyType("+accounts[1]+") is not correct")
        });

        it("should not add key type 1 by actor", async () => {            
            await identity.addKey(accounts[2], 2, {from: accounts[0]})
            try {
                await identity.addKey(accounts[1], 1, {from: accounts[2]})
            } catch(e){
            }
            assert.equal(
                await identity.getKeyType(accounts[1]),
                0,
                identity.address+".getKeyType("+accounts[1]+") is not correct")
        });



        it("fire KeyAdded(address indexed key, uint256 indexed type)", async () => {
            identity.addKey(accounts[1], 2, {from: accounts[0]})
            const keyAdded = await TestUtils.listenForEvent(identity.KeyAdded())
            assert(keyAdded.key, accounts[1], "Key is not correct")
            assert(keyAdded.keyType, 2, "Type is not correct")
        });

    });


    describe("removeKey(address _key, uint256 _type)", () => {

        it("MANAGEMENT_KEY should removes a key", async () => {
            await identity.addKey(accounts[1], 1, {from: accounts[0]})
            await identity.removeKey(accounts[0], {from: accounts[1]})    
            assert.equal(
                await identity.getKeyType(accounts[0]),
                0,
                identity.address+".getKeyType("+accounts[0]+") is not 0")
        });
        

        it("other key should not removes a key", async () => {
            await identity.addKey(accounts[1], 1, {from: accounts[0]})
            try {
                await identity.removeKey(accounts[1], {from: accounts[2]})    
            }catch (e) {

            }
            assert.equal(
                await identity.getKeyType(accounts[1]),
                1,
                identity.address+".getKeyType("+accounts[1]+") is not 0")
        });

        it("actor key should not remove key", async () => {
            await identity.addKey(accounts[1], 2, {from: accounts[0]})
            await identity.addKey(accounts[2], 2, {from: accounts[0]})
            try {
                await identity.removeKey(accounts[1], {from: accounts[2]})    
            }catch (e) {

            }
            assert.equal(
                await identity.getKeyType(accounts[1]),
                2,
                identity.address+".getKeyType("+accounts[1]+") is not 0")
        });
        

        it("MANAGEMENT_KEY should not remove itself MANAGEMENT_KEY when there is no other MANAGEMENT_KEY", async () => {
            try {
                await identity.removeKey(accounts[0], {from: accounts[0]})
            } catch(e) {
                //nothing
            }
            assert.equal(
                await identity.getKeyType(accounts[0]),
                1,
                identity.address+".getKeyType("+accounts[0]+") is not MANAGEMENT_KEY")
          
        });

        it("fire KeyRemoved(address indexed key, uint256 indexed type)", async () => {
            await identity.addKey(accounts[1], 2, {from: accounts[0]})
            identity.removeKey(accounts[1], {from: accounts[0]})  
            const keyRemoved = await TestUtils.listenForEvent(identity.KeyRemoved())
            assert(keyRemoved.key, accounts[1], "Key is not correct")
            assert(keyRemoved.keyType, 2, "Type is not correct")
        });

    });


    describe("getKeyType(address _key)", () => {

        it("should start only with initializer as only key", async () => {
            assert.equal(
                await identity.getKeyType(accounts[0]),
                1,
                identity.address+".getKeyType("+accounts[0]+") is not correct")

            assert.equal(
                await identity.getKeyType(accounts[1]),
                0,
                identity.address+".getKeyType("+accounts[1]+") is not correct")
        });

        it("should get type 2 after addKey type 2", async () => {
            await identity.addKey(accounts[1], 2, {from: accounts[0]})
            assert.equal(
                await identity.getKeyType(accounts[1]),
                2,
                identity.address+".getKeyType("+accounts[1]+") is not correct")
            });
            
        it("should get type 999 after addKey type 999", async () => {            
            await identity.addKey(accounts[1], 999, {from: accounts[0]})
            assert.equal(
                await identity.getKeyType(accounts[1]),
                999,
                identity.address+".getKeyType("+accounts[1]+") is not correct")
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


    describe("replaceKey(address _oldKey, address _newKey)", () => {

        it("MANAGEMENT_KEY replace itself (alone)", async () => {
        
        });

        it("MANAGEMENT_KEY replace a key between others", async () => {
            
        });

        it("MANAGEMENT_KEY replace the first key", async () => {
            
        });

        it("MANAGEMENT_KEY replace the last key", async () => {
            
        });

        it("fire KeyReplaced(address indexed oldKey, address indexed newKey, uint256 indexed type)", async () => {

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
                
});
