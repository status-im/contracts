const TestToken = embark.require('Embark/contracts/TestToken');

var accountsArr;

config({
  contracts: {
    "TestToken": {}
  }
}, (err, accounts) => {
  accountsArr = accounts;
});

describe("TestToken", async function() {

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

});
