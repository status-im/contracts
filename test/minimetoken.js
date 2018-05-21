const utils = require('../utils/testUtils')
const ERC20Token = require('./erc20token');
const Controlled = require('./controlled');

describe("MiniMeToken", async function() {
  this.timeout(0);
  var accounts;
  var miniMeTokenClone;
  const b = [];
  
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
    EmbarkSpec.deployAll(contractsConfig, async function(accountsArr) { 
      accounts = accountsArr
      done() 
    });
  });


  it('should generate tokens for address 1', async () => {
    await MiniMeToken.methods.generateTokens(accounts[1], 10).send();
    assert.equal(await MiniMeToken.methods.totalSupply().call(), 10);
    assert.equal(await MiniMeToken.methods.balanceOf(accounts[1]).call(), 10);
    b[0] = await web3.eth.getBlockNumber();
  });

  it('should transfer tokens from address 1 to address 3', async () => {
    await MiniMeToken.methods.transfer(accounts[3], 1).send({from: accounts[1]});
    assert.equal(await MiniMeToken.methods.totalSupply().call(), 10);
    assert.equal(await MiniMeToken.methods.balanceOf(accounts[1]).call(), 9);
    assert.equal(await MiniMeToken.methods.balanceOf(accounts[3]).call(), 1);
    b[1] = await web3.eth.getBlockNumber();
  });

  it('should destroy 3 tokens from 1 and 1 from 2', async () => {
    await MiniMeToken.methods.destroyTokens(accounts[1], 3).send({ from: accounts[0] });
    assert.equal(await MiniMeToken.methods.totalSupply().call(), 7);
    assert.equal(await MiniMeToken.methods.balanceOf(accounts[1]).call(), 6);
    b[2] = await web3.eth.getBlockNumber();
  });


  it('should create the clone token', async () => {
    const miniMeTokenCloneTx = await MiniMeToken.methods.createCloneToken(
      'Clone Token 1',
      18,
      'MMTc',
      0,
      true).send({ from: accounts[0]});
    let addr = miniMeTokenCloneTx.events.NewCloneToken.returnValues[0];
    miniMeTokenClone = new web3.eth.Contract(MiniMeToken._jsonInterface, addr);

    b[3] = await web3.eth.getBlockNumber();

    assert.equal(await miniMeTokenClone.methods.parentToken().call(), MiniMeToken.address);
    assert.equal(await miniMeTokenClone.methods.parentSnapShotBlock().call(), b[3]);
    assert.equal(await miniMeTokenClone.methods.totalSupply().call(), 7);
    assert.equal(await MiniMeToken.methods.balanceOf(accounts[1]).call(), 6);

    assert.equal(await miniMeTokenClone.methods.totalSupplyAt(b[2]).call(), 7);
    assert.equal(await miniMeTokenClone.methods.balanceOfAt(accounts[3], b[2]).call(), 1);
  });

  it('should move tokens in the clone token from 2 to 3', async () => {
    
    await miniMeTokenClone.methods.transfer(accounts[2], 4).send({ from: accounts[1], gas: 1000000 });
    b[4] = await web3.eth.getBlockNumber();

    assert.equal(await MiniMeToken.methods.balanceOfAt(accounts[1], b[3]).call(), 6);
    assert.equal(await MiniMeToken.methods.balanceOfAt(accounts[2], b[3]).call(), 0);
    assert.equal(await miniMeTokenClone.methods.totalSupply().call(), 7);
    assert.equal(await miniMeTokenClone.methods.balanceOf(accounts[1]).call(), 2);
    assert.equal(await miniMeTokenClone.methods.balanceOf(accounts[2]).call(), 4);
    assert.equal(await miniMeTokenClone.methods.balanceOfAt(accounts[1], b[3]).call(), 6);
    assert.equal(await miniMeTokenClone.methods.balanceOfAt(accounts[2], b[3]).call(), 0);
    assert.equal(await miniMeTokenClone.methods.balanceOfAt(accounts[1], b[2]).call(), 6);
    assert.equal(await miniMeTokenClone.methods.balanceOfAt(accounts[2], b[2]).call(), 0);
    assert.equal(await miniMeTokenClone.methods.totalSupplyAt(b[3]).call(), 7);
    assert.equal(await miniMeTokenClone.methods.totalSupplyAt(b[2]).call(), 7);
  });

  it('should create tokens in the child token', async () => {
    await miniMeTokenClone.methods.generateTokens(accounts[1], 10).send({ from: accounts[0], gas: 1000000});
    assert.equal(await miniMeTokenClone.methods.totalSupply().call(), 17);
    assert.equal(await miniMeTokenClone.methods.balanceOf(accounts[1]).call(), 12);
    assert.equal(await miniMeTokenClone.methods.balanceOf(accounts[2]).call(), 4);
  });

  var erc20tokenConfig = {
    "MiniMeTokenFactory": {
    },
    "Contract": { 
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
  Controlled.Test(erc20tokenConfig, async function (accounts, MiniMeToken) {
    
  });

  

});


