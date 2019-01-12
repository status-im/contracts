const Utils = require('../utils/testUtils');
const MiniMeToken = require('Embark/contracts/MiniMeToken');
const TestStatusNetwork = require('Embark/contracts/TestStatusNetwork');
const ERC20TokenSpec = require('./abstract/erc20tokenspec');

config({
  contracts: {
    "MiniMeTokenFactory": {},
    "MiniMeToken": {
      "args":["$MiniMeTokenFactory", "0x0", "0x0", "Status Test Token", 18, "STT", true],
    },
    "TestStatusNetwork": {
      "deploy": true,
      "args": ["0x0", "$MiniMeToken"],
      "onDeploy": [
        "await MiniMeToken.methods.changeController(TestStatusNetwork.address).send()",
        "await TestStatusNetwork.methods.setOpen(true).send()",
      ]
    }
  }
});

contract("TestStatusNetwork", function() {
  this.timeout(0);
  var accounts;
  before(function(done) {
    web3.eth.getAccounts().then(function (res) {
      accounts = res;
      done();
    });
  });

  it("should increase totalSupply in mint", async function() {
    let initialSupply = await MiniMeToken.methods.totalSupply().call();
    await TestStatusNetwork.methods.mint(100).send();
    let result = await MiniMeToken.methods.totalSupply().call();
    assert.equal(result, +initialSupply+100);
  });

  it("should increase accountBalance in mint", async function() {
    let initialBalance = await MiniMeToken.methods.balanceOf(accounts[0]).call();
    await TestStatusNetwork.methods.mint(100).send({from: accounts[0]});
    let result = await MiniMeToken.methods.balanceOf(accounts[0]).call();
    assert.equal(result, +initialBalance+100);
  });
  
  it("should burn account supply", async function() {
    let initialBalance = await MiniMeToken.methods.balanceOf(accounts[0]).call();
    await TestStatusNetwork.methods.destroyTokens(accounts[0], initialBalance).send({from: accounts[0]});
    assert.equal(await MiniMeToken.methods.totalSupply().call(), 0);
    assert.equal(await MiniMeToken.methods.balanceOf(accounts[0]).call(), 0);
  })
});
