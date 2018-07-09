const utils = require('../utils/testUtils')
const assert = require('assert');
const BN = web3.utils.BN;


config({
  contracts: {
    "MiniMeTokenFactory": {
        "gasLimit": 4000000
    },
    "MiniMeToken": {
        "deploy": false,
    },
    "SNT":{
        "instanceOf": "MiniMeToken",
        "args": [
            "$MiniMeTokenFactory",
            utils.zeroAddress,
            0,
            "TestMiniMeToken",
            18,
            "TST",
            true
        ],
        "gasLimit": 4000000
    },
    "DAppStore": {
        "args": ["$SNT"],
        "gasLimit": 4000000
    }
  }
});

describe("DAppStore", function () {
    this.timeout(0);

    let accounts;
    
    before(function(done) {
        
        web3.eth.getAccounts().then((acc) => { 
            accounts = acc; 
            return SNT.methods.generateTokens(accounts[0], 1000000000).send()
        }).then((receipt) => { 
            return SNT.methods.generateTokens(accounts[1], 1000000000).send()
        }).then((receipt) => { 
            return SNT.methods.generateTokens(accounts[2], 500000000).send()
        }).then((receipt) => { 
            return SNT.methods.generateTokens(accounts[3], 500000000).send()
        }).then((receipt) => {
            done(); 
        });
    });

    it("Create a dapp", async () => {

        const _category = web3.utils.toHex("Test");
        const _name = web3.utils.toHex("TestDapp")
        const _id = web3.utils.soliditySha3("TestID");
        const _amountToStake = 1000;

        let receipt = await SNT.methods.approve(DAppStore.options.address, _amountToStake)
                                       .send();

        receipt = await DAppStore.methods.createDApp(_category, 
                                                     _name, 
                                                     _id, 
                                                     _amountToStake)
                                         .send();



        receipt = await SNT.methods.approve(DAppStore.options.address, 100)
                                   .send();
                                    
        receipt = await DAppStore.methods.stake(_id, 100).send();
        
        // console.dir(receipt);
    });

    
});