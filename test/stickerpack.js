const StickerPack = require('Embark/contracts/StickerPack');
config({
  contracts: {
    "StickerPack": {
    },
  }
});

contract("StickerPack", function() {
    this.timeout(0);
    const testMarketid = 1;
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
        await StickerPack.methods.generateToken(packOwner, testMarketid).send();
        assert.equal(await StickerPack.methods.nextId().call(), +tokenPackId+1, "fail nextId");
        assert.equal(await StickerPack.methods.ownerOf(tokenPackId).call(), packOwner, "fail packOwner");
        assert.equal(await StickerPack.methods.tokenMarketId(tokenPackId).call(), testMarketid, "fail testPackMerkleRoot");
    });


});
