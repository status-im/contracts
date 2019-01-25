const Utils = require('../utils/testUtils');
const MiniMeToken = require('Embark/contracts/MiniMeToken');
const TestStatusNetwork = require('Embark/contracts/TestStatusNetwork');
const StickerMarket = require('Embark/contracts/StickerMarket');

config({
  contracts: {
    "MiniMeTokenFactory": {},
    "MiniMeToken": {
      "args":["$MiniMeTokenFactory", "0x0", "0x0", "Status Test Token", 18, "STT", true],
    },
    "TestStatusNetwork": {
      "args": ["0x0", "$MiniMeToken"],
      "onDeploy": [
        "await MiniMeToken.methods.changeController(TestStatusNetwork.address).send()",
        "await TestStatusNetwork.methods.setOpen(true).send()",
      ]
    },
    "StickerMarket": {
        "args": ["$MiniMeToken"]
    }
  }
});

contract("StickerMarket", function() {
    this.timeout(0);
    var accounts;


    before(function(done) {
        web3.eth.getAccounts().then(function (res) {
            accounts = res;
            done();
        });
    });

    it("should register pack", async function() {
        await StickerMarket.methods.setMarketState(true).send();
        let testPack = "0x55c72bf3b3d468c7c36c848a4d49bb11101dc79bc2f6484bf1ef796fc498919a";
        let testPackPrice = "10000000000000000000";
        let packOwner = accounts[1];
        await StickerMarket.methods.registerMarketPack(testPackPrice, packOwner, testPack).send();
        
    });

    it("should buy a pack when market enabled", async function() {
        
        let packBuyer = accounts[2];
        let packId = "0";
        let packPrice = await StickerMarket.methods.marketPriceOf(packId).call();
        await TestStatusNetwork.methods.mint(packPrice).send({from: packBuyer });
        await MiniMeToken.methods.approve(StickerMarket.address, packPrice).send({from: packBuyer });
        await StickerMarket.methods.buyStickerPackToken(packId).send({from: packBuyer });

    });

});
