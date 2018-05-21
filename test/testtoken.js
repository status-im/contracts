const ERC20Token = require('./erc20token');

describe("TestToken", async function() {
  this.timeout(0);
  var accountsArr;

  before(function(done) {
    var contractsConfig = {
      "TestToken": {
      }
    };
    EmbarkSpec.deployAll(contractsConfig, async function(accounts) { 
      accountsArr = accounts
      done() 
    });
  });

  it("should increase totalSupply in mint", async function() {
    let initialSupply = await TestToken.methods.totalSupply().call();
    await TestToken.methods.mint(100).send({from: accountsArr[0]});
    let result = await TestToken.methods.totalSupply().call();
    assert.equal(result, +initialSupply+100);
  });

  it("should increase accountBalance in mint", async function() {
    let initialBalance = await TestToken.methods.balanceOf(accountsArr[0]).call();
    await TestToken.methods.mint(100).send({from: accountsArr[0]});
    let result = await TestToken.methods.balanceOf(accountsArr[0]).call();
    assert.equal(result, +initialBalance+100);
  });
  var erc20tokenConfig = {
    "Contract": { "instanceOf" : "TestToken" }
  }
  ERC20Token.Test(erc20tokenConfig, async function (accounts, TestToken) {
    for(i=0;i<accounts.length;i++){
      await TestToken.methods.mint(7 * 10 ^ 18).send({from: accounts[i]})
    }
  });
});
