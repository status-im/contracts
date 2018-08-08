const utils = require("../utils/testUtils")

const MiniMeToken = require('Embark/contracts/MiniMeToken');
const DelegationProxy = require('Embark/contracts/DelegationProxy');
const tokensBalance = 1000;

config({
    contracts: {
        "MiniMeTokenFactory": {
        },
        "MiniMeToken": {
            "args": [
                "$MiniMeTokenFactory",
                utils.zeroAddress,
                0,
                "TestMiniMeToken",
                18,
                "TST",
                true
            ]
        }, 
        "DelegationProxy": {
            "args": [ 0 ]
        },
        "ChildDelegationProxy": {
            "instanceOf": "DelegationProxy",
            "args": [
                "$DelegationProxy"
            ]
        }

      }
  });

contract("DelegationProxy", function() {
    this.timeout(0);

    var accounts;
    before(function(done) {
      web3.eth.getAccounts().then(function (res) {
        accounts = res;
        done();
      });
    });

    it("should mint balances for DelegationProxy", async function() {
        for(i=0;i<accounts.length;i++){
            await MiniMeToken.methods.generateTokens(accounts[i], tokensBalance).send({from: accounts[0]})
        }      
    })

    it("starts with no delegate", async function () {
        let result = await DelegationProxy.methods.delegatedTo(accounts[0]).call()
        assert.equal(result, utils.zeroAddress)
    })

    it("starts with delegation to self", async function () {
        result = await DelegationProxy.methods.delegationOf(accounts[0]).call()
        assert.equal(result, accounts[0])
        result = await DelegationProxy.methods.influenceOf(accounts[0], MiniMeToken.address).call()
        assert.equal(result, tokensBalance)
        result = await DelegationProxy.methods.delegatedInfluenceFrom(accounts[0], MiniMeToken.address).call()
        assert.equal(result, 0)
        
    })

    it("a0 delegate to a1", async function () {
        result = await DelegationProxy.methods.delegate(accounts[1]).send({from: accounts[0]})
        const delegateArgs = result.events.Delegate.returnValues;
        assert.equal(delegateArgs.who, accounts[0])
        assert.equal(delegateArgs.to, accounts[1])

        result = await DelegationProxy.methods.delegatedTo(accounts[0]).call()
        assert.equal(result, accounts[1])

        result = await DelegationProxy.methods.delegationOf(accounts[0]).call()
        assert.equal(result, accounts[1])

        result = await DelegationProxy.methods.delegatedInfluenceFrom(accounts[1], MiniMeToken.address).call()
        assert.equal(result, 1000)

        result = await DelegationProxy.methods.influenceOf(accounts[0], MiniMeToken.address).call()
        assert.equal(result, 0)
        result = await DelegationProxy.methods.influenceOf(accounts[1], MiniMeToken.address).call()
        assert.equal(result, 2000)


        
    })

    it("a1 delegate to a2", async function () {
        result = await DelegationProxy.methods.delegate(accounts[2]).send({from: accounts[1]})
        const delegateArgs = result.events.Delegate.returnValues;
        assert.equal(delegateArgs.who, accounts[1])
        assert.equal(delegateArgs.to, accounts[2])

        result = await DelegationProxy.methods.delegatedTo(accounts[1]).call()
        assert.equal(result, accounts[2])

        result = await DelegationProxy.methods.delegationOf(accounts[0]).call()
        assert.equal(result, accounts[2])
        result = await DelegationProxy.methods.delegationOf(accounts[1]).call()
        assert.equal(result, accounts[2])

        result = await DelegationProxy.methods.delegatedInfluenceFrom(accounts[2], MiniMeToken.address).call()
        assert.equal(result, 2000)
        
        result = await DelegationProxy.methods.influenceOf(accounts[1], MiniMeToken.address).call()
        assert.equal(result, 0)
        result = await DelegationProxy.methods.influenceOf(accounts[2], MiniMeToken.address).call()
        assert.equal(result, 3000)
    })


    it("a2 delegate to a3", async function () {
        result = await DelegationProxy.methods.delegate(accounts[3]).send({from: accounts[2]})
        const delegateArgs = result.events.Delegate.returnValues;
        assert.equal(delegateArgs.who, accounts[2])
        assert.equal(delegateArgs.to, accounts[3])

        
        result = await DelegationProxy.methods.delegatedTo(accounts[2]).call()
        assert.equal(result, accounts[3])
        
        result = await DelegationProxy.methods.delegationOf(accounts[0]).call()
        assert.equal(result, accounts[3])
        result = await DelegationProxy.methods.delegationOf(accounts[1]).call()
        assert.equal(result, accounts[3])
        result = await DelegationProxy.methods.delegationOf(accounts[2]).call()
        assert.equal(result, accounts[3])

        result = await DelegationProxy.methods.delegatedInfluenceFrom(accounts[3], MiniMeToken.address).call()
        assert.equal(result, 3000)
        
        result = await DelegationProxy.methods.influenceOf(accounts[2], MiniMeToken.address).call()
        assert.equal(result, 0)
        result = await DelegationProxy.methods.influenceOf(accounts[3], MiniMeToken.address).call()
        assert.equal(result, 4000)
    })    


    it("Child Delegate to Default", async function () {
        result = await ChildDelegationProxy.methods.delegatedTo(accounts[2]).call()
        assert.equal(result, accounts[3])

        result = await ChildDelegationProxy.methods.delegationOf(accounts[0]).call()
        assert.equal(result, accounts[3])
        result = await ChildDelegationProxy.methods.delegationOf(accounts[1]).call()
        assert.equal(result, accounts[3])
        result = await ChildDelegationProxy.methods.delegationOf(accounts[2]).call()
        assert.equal(result, accounts[3])

        result = await ChildDelegationProxy.methods.delegatedInfluenceFrom(accounts[3], MiniMeToken.address).call()
        assert.equal(result, 3000)
        
        result = await ChildDelegationProxy.methods.influenceOf(accounts[2], MiniMeToken.address).call()
        assert.equal(result, 0)
        result = await ChildDelegationProxy.methods.influenceOf(accounts[3], MiniMeToken.address).call()
        assert.equal(result, 4000)
    })    

    it("Child a2 delegate to a4", async function () {
        result = await ChildDelegationProxy.methods.delegate(accounts[4]).send({from: accounts[2]})
        const delegateArgs = result.events.Delegate.returnValues;
        assert.equal(delegateArgs.who, accounts[2])
        assert.equal(delegateArgs.to, accounts[4])
        
        result = await ChildDelegationProxy.methods.delegatedTo(accounts[2]).call()
        assert.equal(result, accounts[4])
        
        result = await ChildDelegationProxy.methods.delegationOf(accounts[0]).call()
        assert.equal(result, accounts[4])
        result = await ChildDelegationProxy.methods.delegationOf(accounts[1]).call()
        assert.equal(result, accounts[4])
        result = await ChildDelegationProxy.methods.delegationOf(accounts[2]).call()
        assert.equal(result, accounts[4])

        result = await ChildDelegationProxy.methods.delegatedInfluenceFrom(accounts[3], MiniMeToken.address).call()
        assert.equal(result, 0)
        
        result = await ChildDelegationProxy.methods.influenceOf(accounts[2], MiniMeToken.address).call()
        assert.equal(result, 0)
        result = await ChildDelegationProxy.methods.influenceOf(accounts[4], MiniMeToken.address).call()
        assert.equal(result, 4000)
        result = await ChildDelegationProxy.methods.influenceOf(accounts[3], MiniMeToken.address).call()
        assert.equal(result, 1000)
    })    

})