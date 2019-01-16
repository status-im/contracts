const Sticker = require('Embark/contracts/Sticker');
const { MerkleTree } = require('../utils/merkleTree.js');
const { zeroAddress, zeroBytes32 } = require('../utils/testUtils.js');
const { sha3, bufferToHex } = require('ethereumjs-util');
config({
  contracts: {
    "Sticker": {
    },
  }
});

contract("Sticker", function() {
    this.timeout(0);
    const stickerData = "QmU7VWfd3DN1Hh8fjALhQyJLgtkwxkYP2zz9MDT4rkyVJ1";
    const stickerDataHash = bufferToHex(sha3(stickerData));

    var accounts;
    var stickerOwner;
    var tokenStickerId;
    before(function(done) {
        web3.eth.getAccounts().then(function (res) {
            accounts = res;
            stickerOwner = accounts[1];
            done();
        });
    });

    it("should generate a sticker", async function() {
        tokenStickerId = await Sticker.methods.nextId().call();
        await Sticker.methods.generateToken(stickerOwner, stickerDataHash).send();
        assert.equal(await Sticker.methods.nextId().call(), +tokenStickerId+1, "fail nextId");
        assert.equal(await Sticker.methods.ownerOf(tokenStickerId).call(), stickerOwner, "fail stickerOwner");
        assert.equal(await Sticker.methods.dataHash(tokenStickerId).call(), stickerDataHash, "fail dataHash");
    });


    it("should destroy a sticker", async function() {
        await Sticker.methods.destroyToken(tokenStickerId).send();
        assert.equal(await Sticker.methods.dataHash(tokenStickerId).call(), zeroBytes32, "fail dataHash");
    });


});
