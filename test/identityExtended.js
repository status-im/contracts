const TestUtils = require("../utils/testUtils.js")
var ethUtils = require('ethereumjs-util')

const Identity = artifacts.require("./identity/Identity.sol");

contract('Identity - Extended Functionality', function(accounts) {

    let identity;

    beforeEach(async () => {
        identity = await Identity.new({from: accounts[0]});     
    })


    describe("Identity()", () => {
        
        let privateKey = new Buffer('61bffea9215f65164ad18b45aff1436c0c165d0d5dd2087ef61b4232ba6d2c1a', 'hex')
        let publicKey = ethUtils.privateToPublic(privateKey);
        let pkSha = web3.sha3(publicKey.toString('hex'), {encoding: 'hex'}); 
        
        it("Add ECDSA Management Key", async () => {

          await identity.addKey(pkSha, 2, 1, {from: accounts[0]})
          
          await identity.addPublicKey(pkSha, '0x' + publicKey.toString('hex'), {from: accounts[0]});
       
          assert.equal(
            await identity.getPublicKey(pkSha, {from: accounts[0]}),
            '0x' + publicKey.toString('hex'),
            identity.address+".getPublicKey("+pkSha+") is not correct");

        });


        it("Test Execution", async () => {

            let to = accounts[1];
            let value = 100;
            let data = '';
            
            let message = ethUtils.toBuffer("SignedMessage");
            let msgHash = ethUtils.hashPersonalMessage(message);
            let sig = ethUtils.ecsign(msgHash, privateKey);
          
            let r = '0x' + sig.r.toString('hex');
            let s = '0x' + sig.s.toString('hex');
            let v = sig.v;


            await identity.addKey(pkSha, 2, 1, {from: accounts[0]})
            
            await identity.addPublicKey(pkSha, '0x' + publicKey.toString('hex'), {from: accounts[0]});
         
            let tx = await identity.executeECDSA(to, value, data, pkSha, '0x' + msgHash.toString('hex'), v, r, s, {from: accounts[0]});
            
            // TODO Assert ExecutionRequested Event
            console.log(tx)
        
        });
    });



});
