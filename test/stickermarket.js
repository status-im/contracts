const Utils = require('../utils/testUtils');
const MiniMeToken = require('Embark/contracts/MiniMeToken');
const TestStatusNetwork = require('Embark/contracts/TestStatusNetwork');
const StickerMarket = require('Embark/contracts/StickerMarket');
const { MerkleTree } = require('../utils/merkleTree.js');

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
    },
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
        let testPack = [
            "QmU7VWfd3DN1Hh8fjALhQyJLgtkwxkYP2zz9MDT4rkyVJ1",
            "QmdhTuX4V4uAUKotFTFpeHDEkSDvWVGfsvqT5EwtmtnPUW",
            "Qmep61aZqJhhmSkhQHUSUme5RFbi8ZfccxXC1TyjKHcEig",
            "QmVFnUPr8M49AHqprnK5ca5LdE2tJFmStJ1id9BBxHdAof",
            "QmTbhNNgnSzDnQj8mLELcxqZKwUwbzpnHj2iMeqscjpDEF",
            "QmVBJ5meMDhEUBqXygQdm56Gwq9ycTfiyznN2gc516pp3o",
            "QmazRLjjzLYDnxVMEMEmKd5w8KxYMyaQ3wMakLcz5iKyNc",
            "QmVjPM3duQJvu56PeiRy5iv7uNGjm9yxe5MTBDrpd2je25"
        ]
        let testPackMerkleTree = new MerkleTree(testPack);
        let testPackMerkleRoot = testPackMerkleTree.getHexRoot();
        let testPackPrice = "10000000000000000000";
        let packOwner = accounts[1];
        await StickerMarket.methods.register(testPackMerkleRoot, testPackPrice, packOwner, "0x").send();
        
    });

    it("should buy a pack", async function() {
        let packBuyer = accounts[2];
        let packId = "0";
        let packPrice = await StickerMarket.methods.priceOf(packId).call();
        await TestStatusNetwork.methods.mint(packPrice).send({from: packBuyer });

        await MiniMeToken.methods.approve(StickerMarket.address, packPrice).send({from: packBuyer });
        await StickerMarket.methods.buy(packId).send({from: packBuyer });

    });

});
