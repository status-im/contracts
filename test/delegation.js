const utils = require("../utils/testUtils")

const DefaultDelegation = require('Embark/contracts/DefaultDelegation');
const DelegationFactory = require('Embark/contracts/DelegationFactory');
const DelegationBase = require('Embark/contracts/DelegationBase');

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

  /**
   *  Delegations: Root, Sticker Market, ENS Usernames, Version Listings 
   *  Functions:
   *   - Root
   *   - Sticker Market
   *        - change controller : Absolute Majority 
   *        - change rates : Simple Majority 
   *        - purgconte pack : Simple Majority
   *   - ENS Usernames
   *        - change controller : Simple Majority
   *        - migrate registry : 
   *        - change price
   *   - Version Listing
   *        - change developer address
   *        - remove version
   *        - add release category (android,ios,linux,etc) 
   * 
   * 
   * 
   */

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
        var NoDefaultDelegation = new web3.eth.Contract(DelegationBase._jsonInterface, result.events.InstanceCreated.returnValues[0]);
        result = await NoDefaultDelegation.methods.delegatedTo(accounts[0]).call()
        assert.equal(result, accounts[0])
        result = await NoDefaultDelegation.methods.delegationOf(accounts[0]).call()
        assert.equal(result, accounts[0])    
    })

    it("creates root delegation", async function () {
        let result = await DelegationFactory.methods.createDelegation(DefaultDelegation._address).send();
        RootDelegation = new web3.eth.Contract(DelegationBase._jsonInterface, result.events.InstanceCreated.returnValues[0]);
        defaultDelegate = await DefaultDelegation.methods.defaultDelegate().call();
    })

    it("starts with default delegate", async function () {
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
        ChildDelegation = new web3.eth.Contract(DelegationBase._jsonInterface, result.events.InstanceCreated.returnValues[0]);
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

    it("default delegate should be able to delegate", async function () {
        await ChildDelegation.methods.delegate(accounts[6]).send({from: accounts[6]})
        newDelegate = await ChildDelegation.methods.delegationOf(accounts[6]).call()
        result = await ChildDelegation.methods.delegate(accounts[6]).send({from: defaultDelegate})
        const delegateArgs = result.events.Delegate.returnValues;
        assert.equal(delegateArgs.who, defaultDelegate)
        assert.equal(delegateArgs.to, accounts[6])
        
        result = await ChildDelegation.methods.delegatedTo(defaultDelegate).call()
        assert.equal(result, accounts[6])
        
        result = await ChildDelegation.methods.delegationOf(accounts[0]).call()
        assert.equal(result, newDelegate)
        result = await ChildDelegation.methods.delegationOf(accounts[1]).call()
        assert.equal(result, newDelegate)
        result = await ChildDelegation.methods.delegationOf(accounts[2]).call()
        assert.equal(result, newDelegate)

        
    })   
})