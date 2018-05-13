describe("TestToken", async function() {
  this.timeout(0);
  var accountsArr;

  before(function(done) {
    this.timeout(0);
    var contractsConfig = {
      "TestToken": {
      }
    };
    EmbarkSpec.deployAll(contractsConfig, async function(accounts) { 
      accountsArr = accounts
      for(i=0;i<accountsArr.length;i++) {
        await TestToken.methods.mint(7 * 10 ^ 18).send({from: accountsArr[i]})
      }
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
  
});
