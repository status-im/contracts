const utils = require('../utils/testUtils')
const assert = require('assert');
const ProposalManager = require('Embark/contracts/ProposalManager');
const BasicTCR = require('Embark/contracts/BasicTCR');
const BN = web3.utils.BN;


config({
  contracts: {
    "MiniMeTokenFactory": {
        "gasLimit": 4000000
    },
    "MiniMeToken": {
        "deploy": false,
    },
    "RandomToken":{
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
    "DelegationProxyFactory": {
        "deploy": true,
        "gasLimit": 7000000
    },
    "TrustNetwork": {
        "args": ["$DelegationProxyFactory"],
        "gasLimit": 4000000
    },
    "ProposalManager": { "deploy": false },
    "BasicTCR": {
        "deploy": false
    },
    "Providers": {
        "args": ["$RandomToken", "$TrustNetwork"],
        "instanceOf": "BasicTCR",
        "gasLimit": 4000000
    }
  }
});

describe("280-disc-mail-servers", function () {
    this.timeout(0);

    let accounts;
    
    before(function(done) {
        
        web3.eth.getAccounts().then((acc) => { 
            accounts = acc; 
            return RandomToken.methods.generateTokens(accounts[0], 10000).send()
        }).then((receipt) => { 
            return RandomToken.methods.generateTokens(accounts[1], 10000).send()
        }).then((receipt) => { 
            return RandomToken.methods.generateTokens(accounts[2], 500).send()
        }).then((receipt) => { 
            return RandomToken.methods.generateTokens(accounts[3], 500).send();
        }).then((receipt) => {
            // For test purposes all the voting and whitelisting periods are set to 10
            return Providers.methods.updatePeriods(10, 10).send();
        }).then((receipt) => {
            done(); 
        });
    });

    it("Test 1", async function(){
        // Get the submission price to create a new item in the providers TCR
        const submitPrice = await Providers.methods.getSubmitPrice(accounts[0]).call();

        // Create a provider contract to hold the resources
        const ProviderContract = await BasicTCR.deploy({arguments: [RandomToken.options.address, TrustNetwork.options.address]}).send();
        
        // Assume PubKey is stored in swarm
        let data = {
            "address": ProviderContract.options.address,
            "PK_Hash": "0x12120851ef054c268a2438f10a21f6efe3dc3dcdcc2ea0e6a1a7a38bf8c91e23"
        }

        // We convert the data object to hex to store it as data
        let hexData = web3.utils.toHex(JSON.stringify(data));

        // Since a TCR requires staking tokens, it is necessary to add an allowance to the providers contract
        receipt = await RandomToken.methods.approve(Providers.options.address, submitPrice).send();

        // We add our provider data to the providers TCR
        receipt = await Providers.methods.submitItem(hexData, submitPrice).send();
        assert.equal(!!receipt.events.ItemSubmitted, true, "ItemSubmitted not triggered");

        const itemId = receipt.events.ItemSubmitted.returnValues.itemId;
    
        // Item should be invalid in this moment
        let itemValid = await Providers.methods.isValid(itemId).call();
        assert.equal(itemValid, false, "Provider should be invalid");

        // After 11 blocks, we can whitelist our new provider
        await utils.mineBlocks(11);
        receipt = await Providers.methods.processItem(itemId).send();
        assert.equal(!!receipt.events.ItemWhitelisted, true, "ItemWhitelisted not triggered");

        // Validate an item
        itemValid = await Providers.methods.isValid(itemId).call();
        assert.equal(itemValid, true, "Provider should be valid");

        const RegisteredProvider = await Providers.methods.items(itemId).call();
        const providerData = JSON.parse(web3.utils.toAscii(RegisteredProvider.data));
        assert.equal(providerData.address, ProviderContract.options.address, "Addresses don't match");

        // =============================================
        // Loading a provider 
        // =============================================

        const MyProvider = BasicTCR;
        MyProvider.options.address = providerData.address; // Address can be obtained from the data of an item stored in the Providers TCR

        // Register a resource 
        data = { "PK_Hash": "0x12120851ef054c268a2438f10a21f6efe3dc3dcdcc2ea0e6a1a7a38bf8c91e23" }
        hexData = web3.utils.toHex(JSON.stringify(data));

        receipt = await RandomToken.methods.approve(MyProvider.options.address, submitPrice).send();

        receipt = await MyProvider.methods.submitItem(hexData, submitPrice).send();

        assert.equal(!!receipt.events.ItemSubmitted, true, "ItemSubmitted not triggered");
    });
});