const Utils = require('../utils/testUtils');
const TestToken = require('Embark/contracts/TestToken');
const ERC20TokenSpec = require('./abstract/erc20tokenspec');

config({
  contracts: {
    "TestToken": {
    },
    ...ERC20TokenSpec.config.contracts
  }
});

contract("TestToken", function() {
  this.timeout(0);
  var accounts;
  before(function(done) {
    web3.eth.getAccounts().then(function (res) {
      accounts = res;
      done();
    });
  });

  it("should increase totalSupply in mint", async function() {
    let initialSupply = await TestToken.methods.totalSupply().call();
    await TestToken.methods.mint(100).send();
    let result = await TestToken.methods.totalSupply().call();
    assert.equal(result, +initialSupply+100);
  });

  it("should increase accountBalance in mint", async function() {
    let initialBalance = await TestToken.methods.balanceOf(accounts[0]).call();
    await TestToken.methods.mint(100).send({from: accounts[0]});
    let result = await TestToken.methods.balanceOf(accounts[0]).call();
    assert.equal(result, +initialBalance+100);
  });
  
  it("should burn account supply", async function() {
    let initialBalance = await TestToken.methods.balanceOf(accounts[0]).call();
    await TestToken.methods.transfer(Utils.zeroAddress, initialBalance).send({from: accounts[0]});
    assert.equal(await TestToken.methods.totalSupply().call(), 0);
    assert.equal(await TestToken.methods.balanceOf(accounts[0]).call(), 0);
  })

  it("should mint balances for ERC20TokenSpec", async function() {
    let initialBalance = 7 * 10 ^ 18;
    for(i=0;i<accounts.length;i++){
      await TestToken.methods.mint(initialBalance).send({from: accounts[i]})
      assert.equal(await TestToken.methods.balanceOf(accounts[i]).call(), initialBalance);
    }    
  })
  
  ERC20TokenSpec.Test(TestToken);


});
