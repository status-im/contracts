describe("TestToken", function() {
  this.timeout(0);
  var accountsArr;
  before(function(done) {
    this.timeout(0);
    var contractsConfig = {
      "TestToken": {
      }
    };
    EmbarkSpec.deployAll(contractsConfig, (accounts) => { accountsArr = accounts; done() });
  });

  
  it("should start totalSupply 0", async function() {
    let result = await TestToken.methods.totalSupply().call();
    assert.equal(result, 0);
  });

  it("should increase totalSupply in mint", async function() {
    let initialSupply = await TestToken.methods.balanceOf(accountsArr[0]).call();
    await TestToken.methods.mint(100).send({from: accountsArr[0]});
    let result = await TestToken.methods.totalSupply().call();
    assert.equal(result, 100);
  });

  it("should increase accountBalance in mint", async function() {
    let initialBalance = await TestToken.methods.balanceOf(accountsArr[0]).call();
    await TestToken.methods.mint(100).send({from: accountsArr[0]});
    let result = await TestToken.methods.totalSupply().call();
    assert.equal(result, +initialBalance+100);
  });


});
