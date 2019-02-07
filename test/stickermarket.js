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
    var testPacks;
    let registeredPacks = [];
    
    before(function(done) {
        web3.eth.getAccounts().then(function (res) {
            accounts = res;
            testPacks = [
                {
                    category: ["0x00000000", "0x00000001","0x00000002","0x00000003","0x00000004"],
                    price: "10000000000000000000",
                    donate: "0",
                    contentHash:"0x55c72bf3b3d468c7c36c848a4d49bb11101dc79bc2f6484bf1ef796fc498919a",
                    owner: accounts[1]
                },
                {
                    category: ["0x00000000", "0x00000001"],
                    price: "10000000000000000000",
                    donate: "10",
                    contentHash:"0xe434491f185cedfea522bd0b937ce849906833aefa20a76e8e50db194baf34cb",
                    owner: accounts[2]
                },
                {
                    category: ["0x00000000", "0x00000001","0x00000002","0x00000004"],
                    price: "10000000000000000000",
                    donate: "100",
                    contentHash:"0xf4c247e858aba2942bf0ed6008c15a387c88c262c70f930ab91799655d71367d",
                    owner: accounts[3]
                },
                {
                    category: ["0x00000000", "0x00000002","0x00000003","0x00000004"],
                    price: "10000000000000000000",
                    donate: "1000",
                    contentHash:"0x66c2aec914d17249c66a750303521a51607c38d084ae173976e54ad40473d056",
                    owner: accounts[4]
                },
                {
                    category: ["0x00000000", "0x00000001","0x00000002","0x00000004"],
                    price: "10000000000000000000",
                    donate: "10000",
                    contentHash:"0x4e25277a1af127bd1c2fce6aa20ac7eae8fded9c615b7964ebe9e18779765108",
                    owner: accounts[5]
                },
                {
                    category: ["0x00000000", "0x00000004"],
                    price: "10000000000000000000",
                    donate: "2",
                    contentHash:"0x659c423e40fc2b4f37ada1dda463aa4455d650d799d82e63af87ac8b714bee66",
                    owner: accounts[6]
                },
                {
                    category: ["0x00000000", "0x00000003","0x00000004"],
                    price: "10000000000000000000",
                    donate: "20",
                    contentHash:"0xbbf932b8a154bc1d496ebbfa2acca571119d53a6cb5986d8a187e85ac8a37265",
                    owner: accounts[7]
                },
                {
                    category: ["0x00000000", "0x00000003"],
                    price: "10000000000000000000",
                    donate: "200",
                    contentHash:"0x6dd4cbc4a86825506bf85defa071a4e6ac5d76a1b6912863ef0e289327df08d2",
                    owner: accounts[8]
                }
            ];
            done();
        });
    });

    it("should register packs", async function() {
        for(let i = 0; i < testPacks.length; i++){
            let pack = testPacks[i];
            let reg = await StickerMarket.methods.registerPack(pack.price, pack.donate, pack.category, pack.owner, pack.contentHash).send();    
            registeredPacks.push({id: reg.events.Register.returnValues.packId, data: pack})
        };
        for(let i = 0; i < registeredPacks.length; i++){
            for(let j = 0; j < registeredPacks[i].data.category.length; j++) {
                assert.notEqual((await StickerMarket.methods.getAvailablePacks(registeredPacks[i].data.category[j]).call()).indexOf(registeredPacks[i].id), -1);    
            }
        }
    });


    it("should categorize packs", async function() {
        for(let i = 0; i < registeredPacks.length; i++){
            assert.equal((await StickerMarket.methods.getPackData(registeredPacks[i].id).call()).category.indexOf("0x12345678"),-1);
            assert.equal((await StickerMarket.methods.getAvailablePacks("0x12345678").call()).indexOf(registeredPacks[i].id), -1);
            await StickerMarket.methods.addPackCategory(registeredPacks[i].id, "0x12345678").send();
            assert.notEqual((await StickerMarket.methods.getPackData(registeredPacks[i].id).call()).category.indexOf("0x12345678"),-1);
            assert.notEqual((await StickerMarket.methods.getAvailablePacks("0x12345678").call()).indexOf(registeredPacks[i].id), -1);
            registeredPacks[i].data.category.push("0x12345678")
        };
        
    });

    it("should uncategorize packs", async function() {
        for(let i = 0; i < testPacks.length; i++){
            assert.notEqual((await StickerMarket.methods.getAvailablePacks("0x00000000").call()).indexOf(registeredPacks[i].id), -1);
            assert.notEqual((await StickerMarket.methods.getPackData(registeredPacks[i].id).call()).category.indexOf("0x00000000"),-1);
            await StickerMarket.methods.removePackCategory(i, "0x00000000").send();
            assert.equal((await StickerMarket.methods.getAvailablePacks("0x00000000").call()).indexOf(registeredPacks[i].id), -1);
            assert.equal((await StickerMarket.methods.getPackData(registeredPacks[i].id).call()).category.indexOf("0x00000000"),-1);
            registeredPacks[i].data.category = registeredPacks[i].data.category.filter(function(value, index, arr){
                return value != "0x00000000";           
            });
        };
        
    });

    it("should mint packs", async function() {
        let burnRate = 10;
        await StickerMarket.methods.setBurnRate(burnRate).send();
        let packBuyer = accounts[2];
        for(let i = 0; i < registeredPacks.length; i++){
            await TestStatusNetwork.methods.mint(registeredPacks[i].data.price).send({from: packBuyer });
            await MiniMeToken.methods.approve(StickerMarket.address, registeredPacks[i].data.price).send({from: packBuyer });
            let buy = await StickerMarket.methods.buyToken(registeredPacks[i].id, packBuyer).send({from: packBuyer });
            let tokenId;
            let toArtist = 0;
            let donated = 0;
            let burned = 0;
            let burnAddress =(await MiniMeToken.methods.controller().call());

            for(let j = 0; j < buy.events.Transfer.length; j++) {
                if(buy.events.Transfer[j].address == MiniMeToken.address){
                    if(buy.events.Transfer[j].returnValues.to == StickerMarket.address){
                        donated = parseInt(buy.events.Transfer[j].raw.data, 16).toString(10)
                    }else if(buy.events.Transfer[j].returnValues.to == registeredPacks[i].data.owner){
                        toArtist = parseInt(buy.events.Transfer[j].raw.data, 16).toString(10)
                    }else if(buy.events.Transfer[j].returnValues.to == burnAddress){
                        burned = parseInt(buy.events.Transfer[j].raw.data, 16).toString(10)
                    }
                }else if(buy.events.Transfer[j].address == StickerMarket.address){
                    tokenId = buy.events.Transfer[j].returnValues.tokenId;
                }
            }

            assert.equal(registeredPacks[i].data.price, (+toArtist + +donated + +burned), "Bad payment")
            assert.equal(burned, (registeredPacks[i].data.price * burnRate) / 10000, "Bad burn") 
            assert.equal(donated, ((+registeredPacks[i].data.price - burned) * registeredPacks[i].data.donate)/10000, "Bad donate")
            assert.equal(toArtist, registeredPacks[i].data.price - (+donated + +burned), "Bad profit")
            assert.equal(await StickerMarket.methods.ownerOf(tokenId).call(), packBuyer, "Bad owner")
            
        }
    });

    it("should purge packs", async function() {
        var i = 0;
        await StickerMarket.methods.purgePack(registeredPacks[i].id, 0).send();  
        for(let j = 0; j < registeredPacks[i].data.category.length; j++) {
            assert.equal((await StickerMarket.methods.getAvailablePacks(registeredPacks[i].data.category[j]).call()).indexOf(registeredPacks[i].id), -1);    
        }

        i = registeredPacks.length-1;
        await StickerMarket.methods.purgePack(registeredPacks[i].id, 0).send();  
        for(let j = 0; j < registeredPacks[i].data.category.length; j++) {
            assert.equal((await StickerMarket.methods.getAvailablePacks(registeredPacks[i].data.category[j]).call()).indexOf(registeredPacks[i].id), -1);    
        }

        i = 2;
        await StickerMarket.methods.purgePack(registeredPacks[i].id, 0).send();  
        for(let j = 0; j < registeredPacks[i].data.category.length; j++) {
            assert.equal((await StickerMarket.methods.getAvailablePacks(registeredPacks[i].data.category[j]).call()).indexOf(registeredPacks[i].id), -1);    
        }

    });

    it("should not mint a pack with price 0", async function() {
        await StickerMarket.methods.setMarketState(1).send();
        let testPack = "0x0000000000000000000000000000000000000000000000000000000000000000";
        let testPackPrice = "0";
        let packOwner = accounts[1];
        let packBuyer = accounts[2];
        let reg = await StickerMarket.methods.registerPack(testPackPrice, 0, ["0x00000000"], packOwner, testPack).send();
        let packId = reg.events.Register.returnValues.packId;
        await TestStatusNetwork.methods.mint("1").send({from: packBuyer });
        await MiniMeToken.methods.approve(StickerMarket.address, "1").send({from: packBuyer });
        Utils.expectThrow(StickerMarket.methods.buyToken(packId, packBuyer).send({from: packBuyer }));
        await StickerMarket.methods.purgePack(packId, 0).send();  

    });

});
