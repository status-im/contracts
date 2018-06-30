
const ERC20Receiver = require('Embark/contracts/ERC20Receiver');

exports.config = {
  contracts : {
    "ERC20Receiver": {
    }
  }
} 

exports.Test = (ERC20Token) => {
    describe("ERC20Token", function() {
    
    var accounts;
    before(function(done) {
      web3.eth.getAccounts().then(function (res) {
        accounts = res;
        done();
      });
    });

    it("should transfer 1 token", async function() {
      let initialBalance0 = await ERC20Token.methods.balanceOf(accounts[0]).call();
      let initialBalance1 = await ERC20Token.methods.balanceOf(accounts[1]).call();
      await ERC20Token.methods.transfer(accounts[1],1).send({from: accounts[0]});
      let result0 = await ERC20Token.methods.balanceOf(accounts[0]).call();
      let result1 = await ERC20Token.methods.balanceOf(accounts[1]).call();
      
      assert.equal(result0, +initialBalance0-1, "account 0 balance unexpected");
      assert.equal(result1, +initialBalance1+1, "account 1 balance unexpected");
    });

    it("should set approved amount", async function() {
      await ERC20Token.methods.approve(accounts[2],10000000).send({from: accounts[0]});
      let result = await ERC20Token.methods.allowance(accounts[0], accounts[2]).call();
      assert.equal(result, 10000000);
    });

    it("should consume allowance amount", async function() {
      let initialAllowance = await ERC20Token.methods.allowance(accounts[0], accounts[2]).call();
      await ERC20Token.methods.transferFrom(accounts[0], accounts[0],1).send({from: accounts[2]});
      let result = await ERC20Token.methods.allowance(accounts[0], accounts[2]).call();
      
      assert.equal(result, +initialAllowance-1);
    });
    
    it("should transfer approved amount", async function() {
      let initialBalance0 = await ERC20Token.methods.balanceOf(accounts[0]).call();
      let initialBalance1 = await ERC20Token.methods.balanceOf(accounts[1]).call();
      await ERC20Token.methods.transferFrom(accounts[0], accounts[1],1).send({from: accounts[2]});
      let result0 = await ERC20Token.methods.balanceOf(accounts[0]).call();
      let result1 = await ERC20Token.methods.balanceOf(accounts[1]).call();
      
      assert.equal(result0, +initialBalance0-1);
      assert.equal(result1, +initialBalance1+1);
    });


    it("should unset approved amount", async function() {
      await ERC20Token.methods.approve(accounts[2],0).send({from: accounts[0]});
      let result = await ERC20Token.methods.allowance(accounts[0], accounts[2]).call();
      assert.equal(result, 0);
    });

    it("should deposit approved amount to contract ERC20Receiver", async function() {
      //ERC20Receiver = await ERC20Receiver.deploy().send();
      //console.log(ERC20Receiver.address);
      await ERC20Token.methods.approve(ERC20Receiver.address, 10).send({from: accounts[0]});
      await ERC20Receiver.methods.depositToken(ERC20Token.address, 10).send({from: accounts[0]});
      let result = await ERC20Receiver.methods.tokenBalanceOf(ERC20Token.address, accounts[0]).call();
      assert.equal(result, 10, "ERC20Receiver.tokenBalanceOf("+ERC20Token.address+","+accounts[0]+") wrong");
    });

    it("should witdraw approved amount from contract ERC20Receiver", async function() {
      let tokenBalance = await ERC20Receiver.methods.tokenBalanceOf(ERC20Token.address, accounts[0]).call();
      await ERC20Receiver.methods.withdrawToken(ERC20Token.address, tokenBalance).send({from: accounts[0]});
      tokenBalance = await ERC20Receiver.methods.tokenBalanceOf(ERC20Token.address, accounts[0]).call();
      assert.equal(tokenBalance, 0, "ERC20Receiver.tokenBalanceOf("+ERC20Token.address+","+accounts[0]+") wrong");
    });

    //TODO: include checks for expected events fired


  });
}