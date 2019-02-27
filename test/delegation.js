const utils = require("../utils/testUtils")

const DefaultDelegation = require('Embark/contracts/DefaultDelegation');
const DelegationFactory = require('Embark/contracts/DelegationFactory');
const Delegation = require('Embark/contracts/Delegation');

config({
    contracts: {
        "DefaultDelegation": {
            "args": [ "$accounts[5]" ]
        },
        "DelegationBase": {
            "args": [ utils.zeroAddress ]
        },
        "DelegationInit": {
        },
        "DelegationFactory": {
            "args": ["$DelegationBase", "$DelegationInit", utils.zeroAddress]
        }

      }
  });

contract("DelegationBase", function() {
    this.timeout(0);
    var defaultDelegate;
    var accounts;
    var RootDelegation;
    var ChildDelegation;
    before(function(done) {
      web3.eth.getAccounts().then(function (res) {
        accounts = res;
        done();
      });
    });


    it("creates headless delegation", async function () {
        let result = await DelegationFactory.methods.createDelegation(utils.zeroAddress).send();
        var NoDefaultDelegation = new web3.eth.Contract(Delegation._jsonInterface, result.events.InstanceCreated.returnValues[0]);
        result = await NoDefaultDelegation.methods.delegatedTo(accounts[0]).call()
        assert.equal(result, accounts[0])
        result = await NoDefaultDelegation.methods.delegationOf(accounts[0]).call()
        assert.equal(result, accounts[0])    
    })

    it("creates root delegation", async function () {
        let result = await DelegationFactory.methods.createDelegation(DefaultDelegation._address).send();
        RootDelegation = new web3.eth.Contract(Delegation._jsonInterface, result.events.InstanceCreated.returnValues[0]);
    })

    it("starts with default delegate", async function () {
        defaultDelegate = await DefaultDelegation.methods.defaultDelegate().call();
        let result = await RootDelegation.methods.delegatedTo(accounts[0]).call()
        assert.equal(result, defaultDelegate)
        result = await RootDelegation.methods.delegationOf(accounts[0]).call()
        assert.equal(result, defaultDelegate)        
    })

    it("a0 delegates to a1", async function () {
        result = await RootDelegation.methods.delegate(accounts[1]).send({from: accounts[0]})
        const delegateArgs = result.events.Delegate.returnValues;
        assert.equal(delegateArgs.who, accounts[0])
        assert.equal(delegateArgs.to, accounts[1])

        result = await RootDelegation.methods.delegatedTo(accounts[0]).call()
        assert.equal(result, accounts[1])

        result = await RootDelegation.methods.delegationOf(accounts[0]).call()
        assert.equal(result, defaultDelegate)
        
    })

    it("a1 delegate to a2", async function () {
        result = await RootDelegation.methods.delegate(accounts[2]).send({from: accounts[1]})
        const delegateArgs = result.events.Delegate.returnValues;
        assert.equal(delegateArgs.who, accounts[1])
        assert.equal(delegateArgs.to, accounts[2])

        result = await RootDelegation.methods.delegatedTo(accounts[1]).call()
        assert.equal(result, accounts[2])

        result = await RootDelegation.methods.delegationOf(accounts[0]).call()
        assert.equal(result, defaultDelegate)
        result = await RootDelegation.methods.delegationOf(accounts[1]).call()
        assert.equal(result, defaultDelegate)

        
    })


    it("a2 delegate to a3", async function () {
        result = await RootDelegation.methods.delegate(accounts[3]).send({from: accounts[2]})
        const delegateArgs = result.events.Delegate.returnValues;
        assert.equal(delegateArgs.who, accounts[2])
        assert.equal(delegateArgs.to, accounts[3])

        result = await RootDelegation.methods.delegatedTo(accounts[2]).call()
        assert.equal(result, accounts[3])
        
        result = await RootDelegation.methods.delegationOf(accounts[0]).call()
        assert.equal(result, defaultDelegate)
        result = await RootDelegation.methods.delegationOf(accounts[1]).call()
        assert.equal(result, defaultDelegate)
        result = await RootDelegation.methods.delegationOf(accounts[2]).call()
        assert.equal(result, defaultDelegate)

        
    })    


    it("creates child delegation", async function () {
        let result = await DelegationFactory.methods.createDelegation(RootDelegation._address).send();
        ChildDelegation = new web3.eth.Contract(Delegation._jsonInterface, result.events.InstanceCreated.returnValues[0]);
    })

    it("Child Delegate to Default", async function () {
        result = await ChildDelegation.methods.delegatedTo(accounts[2]).call()
        assert.equal(result, accounts[3])

        result = await ChildDelegation.methods.delegationOf(accounts[0]).call()
        assert.equal(result, defaultDelegate)
        result = await ChildDelegation.methods.delegationOf(accounts[1]).call()
        assert.equal(result, defaultDelegate)
        result = await ChildDelegation.methods.delegationOf(accounts[2]).call()
        assert.equal(result, defaultDelegate)

        
    })    

    it("Child a2 delegate to a4", async function () {
        result = await ChildDelegation.methods.delegate(accounts[4]).send({from: accounts[2]})
        const delegateArgs = result.events.Delegate.returnValues;
        assert.equal(delegateArgs.who, accounts[2])
        assert.equal(delegateArgs.to, accounts[4])
        
        result = await ChildDelegation.methods.delegatedTo(accounts[2]).call()
        assert.equal(result, accounts[4])
        
        result = await ChildDelegation.methods.delegationOf(accounts[0]).call()
        assert.equal(result, defaultDelegate)
        result = await ChildDelegation.methods.delegationOf(accounts[1]).call()
        assert.equal(result, defaultDelegate)
        result = await ChildDelegation.methods.delegationOf(accounts[2]).call()
        assert.equal(result, defaultDelegate)

        
    })    

})