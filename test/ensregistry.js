const utils = require('../utils/testUtils.js');
const web3Utils = require('web3-utils');
const namehash = require('eth-ens-namehash');
const utils.zeroBytes32 = "0x0000000000000000000000000000000000000000000000000000000000000000";
contract('ENS', function () {

    let ens;
    let accountsArr;

    before(function(done) {
        this.timeout(0);
        var contractsConfig = {
          "ENSRegistry": { },
        };
        EmbarkSpec.deployAll(contractsConfig, function(accounts) { 
          ens = ENSRegistry;
          accountsArr = accounts; 
          done()
        });
      });

    it('should allow ownership transfers', async () => {
        let result = await ens.methods.setOwner(utils.zeroBytes32, accountsArr[1]).send({from: accountsArr[0]});       
        assert.equal(await ens.methods.owner(utils.zeroBytes32).call(), accountsArr[1])
        assert.equal(result.events.Transfer.returnValues.node, utils.zeroBytes32);
        assert.equal(result.events.Transfer.returnValues.owner, accountsArr[1]);
    });

    it('should prohibit transfers by non-owners', async () => {
        try {
            await ens.methods.setOwner(utils.zeroBytes32, accountsArr[2]).send({from: accountsArr[0]});
        } catch (error) {
            return utils.ensureException(error);
        }

        assert.fail('transfer did not fail');
    });

    it('should allow setting resolvers', async () => {
        let result = await ens.methods.setResolver(utils.zeroBytes32, accountsArr[3]).send({from: accountsArr[1]});        
        let args = result.events.NewResolver.returnValues;
        assert.equal(args.node, utils.zeroBytes32);
        assert.equal(args.resolver, accountsArr[3]);
        assert.equal(await ens.methods.resolver(utils.zeroBytes32).call(), accountsArr[3]);
    });

    it('should prevent setting resolvers by non-owners', async () => {
        try {
            await ens.methods.setResolver(utils.zeroBytes32, accountsArr[4]).send({from: accountsArr[0]});
        } catch (error) {
            return utils.ensureException(error);
        }

        assert.fail('setting resolver did not fail');
    });

    it('should allow setting the TTL', async () => {
        let result = await ens.methods.setTTL(utils.zeroBytes32, 3600).send({from: accountsArr[1]});
        assert.equal(await ens.methods.ttl(utils.zeroBytes32).call(), 3600);
        let args = result.events.NewTTL.returnValues;
        assert.equal(args.node, utils.zeroBytes32);
        assert.equal(args.ttl, 3600);
    });

    it('should prevent setting the TTL by non-owners', async () => {
        try {
            await ens.methods.setTTL(utils.zeroBytes32, 1200).send({from: accountsArr[0]});
        } catch (error) {
            return utils.ensureException(error);
        }

        assert.fail('setting resolver did not fail');
    });

    it('should allow the creation of subnodes', async () => {
        let result = await ens.methods.setSubnodeOwner(utils.zeroBytes32, web3Utils.sha3('eth'), accountsArr[2]).send({from: accountsArr[1]});
        assert.equal(await ens.methods.owner(namehash.hash('eth')).call(), accountsArr[2]);
        let args = result.events.NewOwner.returnValues;
        assert.equal(args.node, utils.zeroBytes32);
        assert.equal(args.label, web3Utils.sha3('eth'));
        assert.equal(args.owner, accountsArr[2]);
    });

    it('should prohibit subnode creation by non-owners', async () => {
        try {
            await ens.methods.setSubnodeOwner(utils.zeroBytes32, web3Utils.sha3('eth'), accountsArr[3]).send({from: accountsArr[0]});
        } catch (error) {
            return utils.ensureException(error);
        }

        assert.fail('setting resolver did not fail');
    });
});
