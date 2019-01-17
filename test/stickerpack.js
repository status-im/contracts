const StickerPack = require('Embark/contracts/StickerPack');
const { MerkleTree } = require('../utils/merkleTree.js');
const { sha3 } = require('ethereumjs-util');
config({
  contracts: {
    "StickerPack": {
    },
  }
});

contract("StickerPack", function() {
    this.timeout(0);
    const testPack = [
        "QmU7VWfd3DN1Hh8fjALhQyJLgtkwxkYP2zz9MDT4rkyVJ1",
        "QmdhTuX4V4uAUKotFTFpeHDEkSDvWVGfsvqT5EwtmtnPUW",
        "Qmep61aZqJhhmSkhQHUSUme5RFbi8ZfccxXC1TyjKHcEig",
        "QmVFnUPr8M49AHqprnK5ca5LdE2tJFmStJ1id9BBxHdAof",
        "QmTbhNNgnSzDnQj8mLELcxqZKwUwbzpnHj2iMeqscjpDEF",
        "QmVBJ5meMDhEUBqXygQdm56Gwq9ycTfiyznN2gc516pp3o",
        "QmazRLjjzLYDnxVMEMEmKd5w8KxYMyaQ3wMakLcz5iKyNc",
        "QmVjPM3duQJvu56PeiRy5iv7uNGjm9yxe5MTBDrpd2je25"
    ]
    const testPackMerkleTree = new MerkleTree(testPack);
    const testPackMerkleRoot = testPackMerkleTree.getHexRoot();
    var accounts;
    var packOwner;
    var tokenPackId;
    before(function(done) {
        web3.eth.getAccounts().then(function (res) {
            accounts = res;
            packOwner = accounts[1];
            done();
        });
    });

    it("should generate a pack", async function() {
        tokenPackId = await StickerPack.methods.nextId().call();
        await StickerPack.methods.generateToken(packOwner, testPackMerkleRoot).send();
        assert.equal(await StickerPack.methods.nextId().call(), +tokenPackId+1, "fail nextId");
        assert.equal(await StickerPack.methods.ownerOf(tokenPackId).call(), packOwner, "fail packOwner");
        assert.equal(await StickerPack.methods.dataHash(tokenPackId).call(), testPackMerkleRoot, "fail testPackMerkleRoot");
    });


});
