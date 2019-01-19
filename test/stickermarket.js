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
    const testPackPrice = "10000000000000000000";
    var packOwner;
    var packId;
    var packBuyer;

    before(function(done) {
        web3.eth.getAccounts().then(function (res) {
            accounts = res;
            packOwner = accounts[1]
            packBuyer = accounts[2]
            done();
        });
    });

    it("should register unlimited pack", async function() {

        await StickerMarket.methods.register(testPackMerkleRoot, testPackPrice, 0, packOwner, "0x").send();
        packId = "0";
    });

    it("should buy unlimited pack", async function() {
        let packPrice = await StickerMarket.methods.priceOf(packId).call();
        await TestStatusNetwork.methods.mint(packPrice).send({from: packBuyer });
        await MiniMeToken.methods.approve(StickerMarket.address, packPrice).send({from: packBuyer });
        await StickerMarket.methods.buy(packId).send({from: packBuyer });

    });

    it("should buy another unlimited pack", async function() {
        let packPrice = await StickerMarket.methods.priceOf(packId).call();
        await TestStatusNetwork.methods.mint(packPrice).send({from: packBuyer });
        await MiniMeToken.methods.approve(StickerMarket.address, packPrice).send({from: packBuyer });
        await StickerMarket.methods.buy(packId).send({from: packBuyer });

    });

    it("should register limited pack", async function() {
        await StickerMarket.methods.register("0xDEADBEEF", testPackPrice, 1, packOwner, "0x").send();
        packId = "1";        
    });

    it("should buy a limited pack", async function() {
        let packPrice = await StickerMarket.methods.priceOf(packId).call();
        await TestStatusNetwork.methods.mint(packPrice).send({from: packBuyer });
        await MiniMeToken.methods.approve(StickerMarket.address, packPrice).send({from: packBuyer });
        await StickerMarket.methods.buy(packId).send({from: packBuyer });

    });

    it("should not buy another limited pack", async function() {
        let packPrice = await StickerMarket.methods.priceOf(packId).call();
        await TestStatusNetwork.methods.mint(packPrice).send({from: packBuyer });
        await MiniMeToken.methods.approve(StickerMarket.address, packPrice).send({from: packBuyer });
        Utils.expectThrow(StickerMarket.methods.buy(packId).send({from: packBuyer }))

    });

});
