const utils = require('../utils/testUtils')
const ERC20Token = require('./erc20token');

describe("MiniMeToken", async function() {
  this.timeout(0);
  var accountsArr;

  before(function(done) {
    var contractsConfig = {
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
      }
    };
    EmbarkSpec.deployAll(contractsConfig, async function(accounts) { 
      accountsArr = accounts
      done() 
    });
  });

  it("should increase totalSupply in generateTokens", async function() {
    let initialSupply = await MiniMeToken.methods.totalSupply().call();
    await MiniMeToken.methods.generateTokens(accountsArr[0], 100).send({from: accountsArr[0]});
    let result = await MiniMeToken.methods.totalSupply().call();
    assert.equal(result, +initialSupply+100);
  });

  it("should increase accountBalance in generateTokens", async function() {
    let initialBalance = await MiniMeToken.methods.balanceOf(accountsArr[1]).call();
    await MiniMeToken.methods.generateTokens(accountsArr[1], 100).send({from: accountsArr[0]});
    let result = await MiniMeToken.methods.balanceOf(accountsArr[1]).call();
    assert.equal(result, +initialBalance+100);
  });

  var erc20tokenConfig = {
    "MiniMeTokenFactory": {
    },
    "Token": { 
        "instanceOf" : "MiniMeToken", 
        "args": [
            "$MiniMeTokenFactory",
            utils.zeroAddress,
            0,
            "TestMiniMeToken",
            18,
            "TST",
            true
        ] 
    }
  }
  ERC20Token.Test(erc20tokenConfig, async function (accounts, MiniMeToken) {
    for(i=0;i<accounts.length;i++){
      await MiniMeToken.methods.generateTokens(accounts[i], 7 * 10 ^ 18).send({from: accounts[0]})
    }
  });

});
