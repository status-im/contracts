const TestUtils = require("./TestUtils.js")
const Identity = artifacts.require("./identity/Identity.sol");
const FriendsRecovery = artifacts.require("./identity/FriendsRecovery.sol");

const web3EthAbi = require("web3-eth-abi");

contract('FriendsRecovery', function(accounts) {


    describe("FriendsRecovery()", () => {
        it("test1", async () => {
            
            let identity = await Identity.new({from: accounts[0]});


            // TODO setup recovery contract with real hashes
            let threshold = 3;
            let friendHashes = ["0x1", "0x2", "0x3", "0x4"];
            let recoveryContract = await FriendsRecovery.new(threshold, friendHashes, {from: accounts[0]});

            let functionPayload =  web3EthAbi.encodeFunctionCall({
                                        name: 'setupRecovery',
                                        type: 'function',
                                        inputs: [{
                                            type: 'address',
                                            name: '_recoveryContract'
                                        }]
                                    }, [recoveryContract.address]);

            
            // Setting up recovery contract for identity
            let tx = await identity.execute(identity.address, 0, functionPayload, {from: accounts[0]} );
            

            console.log(tx.logs);
        });
        
    });

    

});
