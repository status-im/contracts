describe("ERC20Token", async function() {
  this.timeout(0);
  var ERC20Token;
  var accountsArr;
  before(function(done) {
    var contractsConfig = {
      "TestToken": { },
      "ERC20Receiver": { }
    };
    EmbarkSpec.deployAll(contractsConfig, async function(accounts) { 
      ERC20Token = TestToken;
      accountsArr = accounts; 
      for(i=0;i<accountsArr.length;i++){
        await ERC20Token.methods.mint(7 * 10 ^ 18).send({from: accountsArr[i]})
      }
      done()
    });
  });

  it("should transfer 1 token", async function() {
    let initialBalance0 = await ERC20Token.methods.balanceOf(accountsArr[0]).call();
    let initialBalance1 = await ERC20Token.methods.balanceOf(accountsArr[1]).call();
    await ERC20Token.methods.transfer(accountsArr[1],1).send({from: accountsArr[0]});
    let result0 = await ERC20Token.methods.balanceOf(accountsArr[0]).call();
    let result1 = await ERC20Token.methods.balanceOf(accountsArr[1]).call();
    
    assert.equal(result0, +initialBalance0-1);
    assert.equal(result1, +initialBalance1+1);
  });

  it("should set approved amount", async function() {
    await ERC20Token.methods.approve(accountsArr[2],10000000).send({from: accountsArr[0]});
    let result = await ERC20Token.methods.allowance(accountsArr[0], accountsArr[2]).call();
    assert.equal(result, 10000000);
  });

  it("should consume allowance amount", async function() {
    let initialAllowance = await ERC20Token.methods.allowance(accountsArr[0], accountsArr[2]).call();
    await ERC20Token.methods.transferFrom(accountsArr[0], accountsArr[0],1).send({from: accountsArr[2]});
    let result = await ERC20Token.methods.allowance(accountsArr[0], accountsArr[2]).call();
    
    assert.equal(result, +initialAllowance-1);
  });
  
  it("should transfer approved amount", async function() {
    let initialBalance0 = await ERC20Token.methods.balanceOf(accountsArr[0]).call();
    let initialBalance1 = await ERC20Token.methods.balanceOf(accountsArr[1]).call();
    await ERC20Token.methods.transferFrom(accountsArr[0], accountsArr[1],1).send({from: accountsArr[2]});
    let result0 = await ERC20Token.methods.balanceOf(accountsArr[0]).call();
    let result1 = await ERC20Token.methods.balanceOf(accountsArr[1]).call();
    
    assert.equal(result0, +initialBalance0-1);
    assert.equal(result1, +initialBalance1+1);
  });


  it("should unset approved amount", async function() {
    await ERC20Token.methods.approve(accountsArr[2],0).send({from: accountsArr[0]});
    let result = await ERC20Token.methods.allowance(accountsArr[0], accountsArr[2]).call();
    assert.equal(result, 0);
  });

  it("should deposit approved amount to contract ERC20Receiver", async function() {
    await ERC20Token.methods.approve(ERC20Receiver.address,10).send({from: accountsArr[0]});
    await ERC20Receiver.methods.depositToken(ERC20Token.address).send({from: accountsArr[0]});
    let result = await ERC20Receiver.methods.tokenBalanceOf(ERC20Token.address, accountsArr[0]).call();
    assert.equal(result, 10, "ERC20Receiver.tokenBalanceOf("+ERC20Token.address+","+accountsArr[0]+") wrong");
  });

  it("should witdraw approved amount from contract ERC20Receiver", async function() {
    let tokenBalance = await ERC20Receiver.methods.tokenBalanceOf(ERC20Token.address, accountsArr[0]).call();
    await ERC20Receiver.methods.withdrawToken(ERC20Token.address, tokenBalance).send({from: accountsArr[0]});
    tokenBalance = await ERC20Receiver.methods.tokenBalanceOf(ERC20Token.address, accountsArr[0]).call();
    assert.equal(tokenBalance, 0, "ERC20Receiver.tokenBalanceOf("+ERC20Token.address+","+accountsArr[0]+") wrong");
  });

  //TODO: include checks for expected events fired


});
