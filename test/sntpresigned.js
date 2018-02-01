var MiniMeTokenPreSignedFactory = artifacts.require('./token/MiniMeTokenPreSignedFactory.sol')
var SNTPreSigned = artifacts.require('./status/SNTPreSigned.sol')

contract('SNTPreSigned', (accounts) => {

  let controller = accounts[0]
  let sender = accounts[1]
  let receiver = accounts[2]
  let startBalance = "10000000000000000000000"
  let amount = "100000000000000000"
  let gasPrice = "1000000"
  let nonce = 1
  let includer = accounts[0]

  let mmtpsFactory;
  before(async () => {
    mmtpsFactory = await MiniMeTokenPreSignedFactory.new({from: controller})
  })
  
  let sntPreSigned;

  beforeEach(async () => {
    mmtpsFactory = await MiniMeTokenPreSignedFactory.new({from: controller})
    sntPreSigned = await SNTPreSigned.new(mmtpsFactory.address, "0x0", {from: controller})
  })

  it('ecrecover works on transferPreSigned', async function() {
    var h = await sntPreSigned.getTransferHash(receiver, amount, gasPrice, nonce)
    var sig = web3.eth.sign(accounts[1], h).slice(2)
    var r = `0x${sig.slice(0, 64)}`
    var s = `0x${sig.slice(64, 128)}`
    var v = web3.toDecimal(sig.slice(128, 130)) + 27
    var result = await sntPreSigned.recoverTransferPreSigned(v, r, s, receiver, amount, gasPrice, nonce)
    assert.equal(result, sender)
  })

  it('transfers using SNTPreSigned as relay-gas', async function () {
    await sntPreSigned.generateTokens(sender, startBalance, {from: controller})

    var h = await sntPreSigned.getTransferHash(receiver, amount, gasPrice, nonce)
    var sig = web3.eth.sign(accounts[1], h).slice(2)
    var r = `0x${sig.slice(0, 64)}`
    var s = `0x${sig.slice(64, 128)}`
    var v = web3.toDecimal(sig.slice(128, 130)) + 27
    await sntPreSigned.transferPreSigned(v, r, s, receiver, amount, gasPrice, nonce)
    
    var result = await sntPreSigned.balanceOf(receiver)
    assert.equal(result.toString(), amount)

    result = await sntPreSigned.balanceOf(includer)
    assert.equal(result.toString(), 133183*gasPrice);

  })

  it('ecrecover works on approveAndCallPreSigned', async function() {
    var h = await sntPreSigned.getApproveAndCallHash(receiver, amount, [], gasPrice, nonce)
    var sig = web3.eth.sign(sender, h).slice(2)
    var r = `0x${sig.slice(0, 64)}`
    var s = `0x${sig.slice(64, 128)}`
    var v = web3.toDecimal(sig.slice(128, 130)) + 27
    var result = await sntPreSigned.recoverApproveAndCallPreSigned(v, r, s, receiver, amount, [], gasPrice, nonce)
    assert.equal(result, sender)
  })


})