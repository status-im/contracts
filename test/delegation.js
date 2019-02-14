const utils = require("../utils/testUtils")

const DelegationView = require('Embark/contracts/DelegationView');
const ChildDelegation = require('Embark/contracts/ChildDelegation');

config({
    contracts: {
        "DelegationView": {
            "args": [ "0x0" ]
        },
        "ChildDelegation": {
            "instanceOf": "DelegationView",
            "args": [
                "$DelegationView"
            ]
        }

      }
  });

contract("DelegationView", function() {
    this.timeout(0);

    var accounts;
    before(function(done) {
      web3.eth.getAccounts().then(function (res) {
        accounts = res;
        done();
      });
    });


    it("starts with no delegate", async function () {
        let result = await DelegationView.methods.delegatedTo(accounts[0]).call()
        assert.equal(result, utils.zeroAddress)
    })

    it("starts with delegation to self", async function () {
        result = await DelegationView.methods.delegationOf(accounts[0]).call()
        assert.equal(result, accounts[0])        
    })

    it("a0 delegate to a1", async function () {
        result = await DelegationView.methods.delegate(accounts[1]).send({from: accounts[0]})
        const delegateArgs = result.events.Delegate.returnValues;
        assert.equal(delegateArgs.who, accounts[0])
        assert.equal(delegateArgs.to, accounts[1])

        result = await DelegationView.methods.delegatedTo(accounts[0]).call()
        assert.equal(result, accounts[1])

        result = await DelegationView.methods.delegationOf(accounts[0]).call()
        assert.equal(result, accounts[1])
        
    })

    it("a1 delegate to a2", async function () {
        result = await DelegationView.methods.delegate(accounts[2]).send({from: accounts[1]})
        const delegateArgs = result.events.Delegate.returnValues;
        assert.equal(delegateArgs.who, accounts[1])
        assert.equal(delegateArgs.to, accounts[2])

        result = await DelegationView.methods.delegatedTo(accounts[1]).call()
        assert.equal(result, accounts[2])

        result = await DelegationView.methods.delegationOf(accounts[0]).call()
        assert.equal(result, accounts[2])
        result = await DelegationView.methods.delegationOf(accounts[1]).call()
        assert.equal(result, accounts[2])

        
    })


    it("a2 delegate to a3", async function () {
        result = await DelegationView.methods.delegate(accounts[3]).send({from: accounts[2]})
        const delegateArgs = result.events.Delegate.returnValues;
        assert.equal(delegateArgs.who, accounts[2])
        assert.equal(delegateArgs.to, accounts[3])

        
        result = await DelegationView.methods.delegatedTo(accounts[2]).call()
        assert.equal(result, accounts[3])
        
        result = await DelegationView.methods.delegationOf(accounts[0]).call()
        assert.equal(result, accounts[3])
        result = await DelegationView.methods.delegationOf(accounts[1]).call()
        assert.equal(result, accounts[3])
        result = await DelegationView.methods.delegationOf(accounts[2]).call()
        assert.equal(result, accounts[3])

        
    })    


    it("Child Delegate to Default", async function () {
        result = await ChildDelegation.methods.delegatedTo(accounts[2]).call()
        assert.equal(result, accounts[3])

        result = await ChildDelegation.methods.delegationOf(accounts[0]).call()
        assert.equal(result, accounts[3])
        result = await ChildDelegation.methods.delegationOf(accounts[1]).call()
        assert.equal(result, accounts[3])
        result = await ChildDelegation.methods.delegationOf(accounts[2]).call()
        assert.equal(result, accounts[3])

        
    })    

    it("Child a2 delegate to a4", async function () {
        result = await ChildDelegation.methods.delegate(accounts[4]).send({from: accounts[2]})
        const delegateArgs = result.events.Delegate.returnValues;
        assert.equal(delegateArgs.who, accounts[2])
        assert.equal(delegateArgs.to, accounts[4])
        
        result = await ChildDelegation.methods.delegatedTo(accounts[2]).call()
        assert.equal(result, accounts[4])
        
        result = await ChildDelegation.methods.delegationOf(accounts[0]).call()
        assert.equal(result, accounts[4])
        result = await ChildDelegation.methods.delegationOf(accounts[1]).call()
        assert.equal(result, accounts[4])
        result = await ChildDelegation.methods.delegationOf(accounts[2]).call()
        assert.equal(result, accounts[4])

        
    })    

})