const TestUtils = require("../utils/testUtils.js")
const idUtils = require("../utils/identityUtils");

const Identity = artifacts.require("./identity/Identity.sol");
const FriendsRecovery = artifacts.require("./identity/FriendsRecovery.sol");
const TestContract = artifacts.require("./tests/TestContract.sol");

const web3Utils = require("web3-utils");
const web3EthAbi = require("web3-eth-abi");
const ethUtils = require('ethereumjs-util')

contract('FriendsRecovery', function(accounts) {

    const friends = [ 
        {address: '0xe6fa5ca5836572e0da4804fe3599958dcfc6ac2a', private: '0xffe4e190cedfdff279f903701ac14b34e082c4e20bf600bcc73239486f24ea0e' },
        {address: '0xe9f16a2443208bbacc187b51f3bae88a49d31d5c', private: '0x8836fe516896c7888f9d7e0f3c0df14dd805634a1cfff15e2255f795c0456027' },
        {address: '0x17090e7674460bd8778b2378ea46238c26da372c', private: '0x6adaf080b209dabe64d72b937fb0708990c2b83aca8ccfb558d61421e3e3c5e5' },
        {address: '0xf2613d4eb15576f7b54b76a73ede4bb7cb8dceda', private: '0xb26484d0d645282a349950c36183d86e51a550fe3c67da3eb20c777cb779d695' },
        {address: '0x387a2d6f98b26094d05c2254106bdb9d11f23d6e', private: '0xa33ca4443deadd935a7524335cb6d546b4650199290c24a4d945ebe48cf889d0' },
    ];

    describe("FriendsRecovery()", () => {
        it("Execute a full recovery", async () => {
            let testContractInstance = await TestContract.new({from: accounts[0]});

            let identity = await Identity.new({from: accounts[0]})

            // A bytes32 string that represents some user data
            const secret = '0x0000000000000000000000000000000000000000000000000000000000123456';
            const hashedSecret = web3Utils.soliditySha3(identity.address, secret);
            

            const newController = accounts[9];
            
            let threshold = 3;
            let friendHashes = [
                web3Utils.soliditySha3(identity.address, secret, friends[0].address),
                web3Utils.soliditySha3(identity.address, secret, friends[1].address), 
                web3Utils.soliditySha3(identity.address, secret, friends[2].address),
                web3Utils.soliditySha3(identity.address, secret, friends[3].address), 
            ];

            let recoveryContract = await FriendsRecovery.new(identity.address, 600, threshold, hashedSecret, friendHashes, {from: accounts[0]});

            // Setting up recovery contract for identity
            let tx1 = await identity.execute(
                identity.address, 
                0, 
                idUtils.encode.setupRecovery(recoveryContract.address), 
                {from: accounts[0]} 
            );
            //console.log(tx1.logs);

            const newSecret = '0x0000000000000000000000000000000000000000000000000000000000abcdef';
            const data = idUtils.encode.managerReset(newController);
            const newHashedSecret = web3Utils.soliditySha3(identity.address, newSecret);
            const newFriendHashes = [
                web3Utils.soliditySha3(accounts[3], newSecret),
                web3Utils.soliditySha3(accounts[4], newSecret), 
                web3Utils.soliditySha3(accounts[5], newSecret)
            ];

            // Normaly we would use soliditySha3, but it doesn't like arrays
            const hashedMessageToSign = await testContractInstance.hash.call(identity.address, secret, identity.address, data, newHashedSecret, newFriendHashes);
            let msgHash = ethUtils.hashPersonalMessage(ethUtils.toBuffer(hashedMessageToSign, 'hex'));
            const friendSignatures = [
                ethUtils.ecsign(msgHash, ethUtils.toBuffer(friends[0].private, 'hex')),
                ethUtils.ecsign(msgHash, ethUtils.toBuffer(friends[1].private, 'hex')),
                ethUtils.ecsign(msgHash, ethUtils.toBuffer(friends[2].private, 'hex')),
                ethUtils.ecsign(msgHash, ethUtils.toBuffer(friends[3].private, 'hex'))
            ];

            let tx2 = await recoveryContract.approvePreSigned(
                hashedMessageToSign, 
                [
                    friendSignatures[0].v, 
                    friendSignatures[1].v, 
                    friendSignatures[2].v
                ],
                [
                    '0x' + friendSignatures[0].r.toString('hex'), 
                    '0x' + friendSignatures[1].r.toString('hex'), 
                    '0x' + friendSignatures[2].r.toString('hex')                    
                ],
                [
                    '0x' + friendSignatures[0].s.toString('hex'), 
                    '0x' + friendSignatures[1].s.toString('hex'), 
                    '0x' + friendSignatures[2].s.toString('hex')                    
                ], 
                {from: accounts[9]});

            let tx3 = await recoveryContract.execute(
                secret,
                identity.address,
                data,
                [
                    friends[0].address, 
                    friends[1].address, 
                    friends[2].address
                ],
                newHashedSecret,
                newFriendHashes,
                {from: accounts[5]});

            await identity.processManagerReset(0, {from: accounts[0]});

            assert.equal(
                await identity.getKeyPurpose(TestUtils.addressToBytes32(newController)),
                idUtils.purposes.MANAGEMENT,
                identity.address + ".getKeyPurpose(" + newController + ") is not MANAGEMENT_KEY")

            assert.equal(
                await identity.getKeyPurpose(TestUtils.addressToBytes32(newController)),
                idUtils.purposes.MANAGEMENT,
                identity.address+".getKeyPurpose("+newController+") is not correct")
        });
        
    });

    

});
