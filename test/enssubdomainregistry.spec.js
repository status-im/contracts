const utils = require('../utils/testUtils.js');
const web3Utils = require('web3-utils');
const namehash = require('eth-ens-namehash');
const TestToken = require('Embark/contracts/TestToken');
const ENSRegistry = require('Embark/contracts/ENSRegistry');
const PublicResolver = require('Embark/contracts/PublicResolver');
const ENSSubdomainRegistry = require('Embark/contracts/ENSSubdomainRegistry');
const { MerkleTree } = require('../utils/merkleTree.js');

const domains = {
  free : {
    name: 'freedomain.eth',
    price: 0,
    namehash: namehash.hash('freedomain.eth')
  },
  paid : {
    name: 'stateofus.eth',
    price: 100000000,
    namehash: namehash.hash('stateofus.eth')
  },
  temp : {
    name: 'temporary.eth',
    price: 100000000,
    namehash: namehash.hash('temporary.eth')
  }
}

const reservedNames = [
  'administrator',
  'support',
  'status',
  'network',
]

// TODO: load file of reserved names and balance array lenght to be even

const merkleTree = new MerkleTree(reservedNames);
const merkleRoot = merkleTree.getHexRoot();

var contractsConfig = {
  "TestToken": {

  },
  "ENSRegistry": {
    "onDeploy": [
      "ENSRegistry.methods.setSubnodeOwner('0x0000000000000000000000000000000000000000000000000000000000000000', '0x4f5b812789fc606be1b3b16908db13fc7a9adf7ca72641f84d75b47069d3d7f0', web3.eth.defaultAccount).send()"
    ]
  },
  "PublicResolver": {
    "args": [
      "$ENSRegistry"
    ]
  },
  "ENSSubdomainRegistry": {
    "args": [
      "$TestToken",
      "$ENSRegistry",
      "$PublicResolver",
      "3", 
      [merkleRoot],
      "0x0"
    ],
    "onDeploy": [
      "ENSRegistry.methods.setSubnodeOwner('0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae', '0xbd99f8d5e7f81d2d7c1da34b67a2bb3a94dd8c9b0ab40ddc077621b98405983b', ENSSubdomainRegistry.address).send()",
      "ENSRegistry.methods.setSubnodeOwner('0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae', '0x7b4768a525e733422bf968587a91b4036e5176d36f44a9fb5b29d0bca03ab3a3', ENSSubdomainRegistry.address).send()",
      "ENSRegistry.methods.setSubnodeOwner('0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae', '0x44fa953dda0aa9a41a27e14a13ed7e08a0d7fc72873516f5b3bf9b50718610df', ENSSubdomainRegistry.address).send()"
    ]
  },
  "UpdatedENSSubdomainRegistry": {
    "instanceOf" : "ENSSubdomainRegistry",
    "args": [
      "$TestToken",
      "$ENSRegistry",
      "$PublicResolver",
      "3", 
      [merkleRoot],
      "$ENSSubdomainRegistry"
    ]
  }

};

config({ contracts: contractsConfig });

contract('ENSSubdomainRegistry', function () {
  let ens;
  let accountsArr;

  before(function(done) {
    web3.eth.getAccounts().then(async (accounts) => {
      ens = ENSRegistry;
      accountsArr = accounts;
      await utils.increaseTime(1 * utils.timeUnits.days) //time cannot start zero
      await utils.increaseTime(1000)
      done();
    })
  });

  describe('setDomainPrice()', function() {
    it('should add free domain', async () => {
      const domain = domains.free;
      const resultSetDomainPrice = await ENSSubdomainRegistry.methods.setDomainPrice(domain.namehash, domain.price).send({from: accountsArr[0]});
      assert.equal(resultSetDomainPrice.events.DomainPrice.returnValues.price, domain.price, "event DomainPrice wrong price");
      assert.equal(resultSetDomainPrice.events.DomainPrice.returnValues.namehash, domain.namehash, "event DomainPrice wrong namehash");
      assert.equal(await ENSSubdomainRegistry.methods.getPrice(domain.namehash).call(), domain.price, "getPrice() wrong price");
      const resultDomainAccount = await ENSSubdomainRegistry.methods.domains(domain.namehash).call()
      assert.equal(resultDomainAccount.state, 1, "Wrong domain state")
      assert.equal(resultDomainAccount.price, domain.price, "Wrong domain price")
    });
    it('should add paid domain', async () => {
      const initialPrice = 100
      const domain = domains.paid;
      const resultSetDomainPrice = await ENSSubdomainRegistry.methods.setDomainPrice(domain.namehash, initialPrice).send({from: accountsArr[0]});
      assert.equal(resultSetDomainPrice.events.DomainPrice.returnValues.price, initialPrice, "event DomainPrice wrong price");
      assert.equal(resultSetDomainPrice.events.DomainPrice.returnValues.namehash, domain.namehash, "event DomainPrice wrong namehash");
      assert.equal(await ENSSubdomainRegistry.methods.getPrice(domain.namehash).call(), initialPrice, "getPrice() wrong price");
      const resultDomainAccount = await ENSSubdomainRegistry.methods.domains(domain.namehash).call()
      assert.equal(resultDomainAccount.state, 1, "Wrong domain state")
      assert.equal(resultDomainAccount.price, initialPrice, "Wrong domain price")
    });
  });

  describe('updateDomainPrice()', function() {
    it('should change paid domain price', async () => {
      const newPrice = domains.paid.price;
      const resultUpdateDomainPrice = await ENSSubdomainRegistry.methods.updateDomainPrice(domains.paid.namehash, newPrice).send({from: accountsArr[0]});
      assert.equal(resultUpdateDomainPrice.events.DomainPrice.returnValues.price, domains.paid.price, "event DomainPrice wrong price");
      assert.equal(resultUpdateDomainPrice.events.DomainPrice.returnValues.namehash, domains.paid.namehash, "event DomainPrice wrong namehash");
      assert.equal(await ENSSubdomainRegistry.methods.getPrice(domains.paid.namehash).call(), newPrice, "Wrong return value at getPrice");
      const resultDomainAccount= await ENSSubdomainRegistry.methods.domains(domains.paid.namehash).call()
      assert.equal(resultDomainAccount.state, 1, "Wrong domain state")
      assert.equal(resultDomainAccount.price, newPrice, "Wrong domain price")
    });
  });

  describe('register()', function() {
    it('should register free subdomain', async () => {
      const subdomain = 'alice';
      const subdomainHash = namehash.hash(subdomain + '.' + domains.free.name);
      const registrant = accountsArr[1];
      const label = web3Utils.sha3(subdomain);
      const node = domains.free.namehash;
      const resultRegister = await ENSSubdomainRegistry.methods.register(
        label,
        node,
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      assert.equal(resultRegister.events['0'].raw.topics[0], '0xce0457fe73731f824cc272376169235128c118b49d344817417c6d108d155e82', "Wrong Event");
      assert.equal(resultRegister.events['0'].raw.topics[1], node, "Wrong Node");
      assert.equal(resultRegister.events['0'].raw.topics[2], label, "Wrong Label");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['0'].raw.data.substring(26)), registrant, "Wrong subnode owner");
      assert.equal(resultRegister.events.SubdomainOwner.returnValues.accountOwner, registrant, "event SubdomainOwner accountOwner mismatch");
      assert.equal(resultRegister.events.SubdomainOwner.returnValues.subdomainHash, subdomainHash, "event SubdomainOwner subdomainHash mismatch");   
      assert.equal(await ens.methods.owner(subdomainHash).call(), registrant, "ENSRegistry owner mismatch");
      assert.equal(await ens.methods.resolver(subdomainHash).call(), utils.zeroAddress, "Resolver wrongly defined");
      assert.equal(await ENSSubdomainRegistry.methods.getAccountBalance(subdomainHash).call(), 0, "Free domain accounts shouldn't have balance");
      assert.equal(await ENSSubdomainRegistry.methods.getAccountOwner(subdomainHash).call(), registrant, "Account owner mismatch");
    });
    it('should register free address only resolver-defined subdomain', async () => {
      const registrant = accountsArr[2];
      const subdomain = 'bob';
      const subdomainHash = namehash.hash(subdomain + '.' + domains.free.name);
      const label = web3Utils.sha3(subdomain);
      const node = domains.free.namehash;
      const resultRegister = await ENSSubdomainRegistry.methods.register(
        web3Utils.sha3(subdomain),
        domains.free.namehash,
        registrant,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      assert.equal(resultRegister.events['0'].raw.topics[0], '0xce0457fe73731f824cc272376169235128c118b49d344817417c6d108d155e82', "Wrong Event");
      assert.equal(resultRegister.events['0'].raw.topics[1], node, "Wrong Node");
      assert.equal(resultRegister.events['0'].raw.topics[2], label, "Wrong Label");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['0'].raw.data.substring(26)), ENSSubdomainRegistry.address, "Wrong subnode owner");
      assert.equal(resultRegister.events['1'].raw.topics[0], '0x335721b01866dc23fbee8b6b2c7b1e14d6f05c28cd35a2c934239f94095602a0', "Wrong Event");
      assert.equal(resultRegister.events['1'].raw.topics[1], subdomainHash, "Wrong Subdomain");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['1'].raw.data.substring(26)), PublicResolver.address, "Wrong Resolver");
      assert.equal(resultRegister.events['2'].raw.topics[0], '0x52d7d861f09ab3d26239d492e8968629f95e9e318cf0b73bfddc441522a15fd2', "Wrong Event");
      assert.equal(resultRegister.events['2'].raw.topics[1], subdomainHash, "Wrong Subdomain");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['2'].raw.data.substring(26)), registrant, "Wrong address to resolve");
      assert.equal(resultRegister.events['3'].raw.topics[0], '0xd4735d920b0f87494915f556dd9b54c8f309026070caea5c737245152564d266', "Wrong Event");
      assert.equal(resultRegister.events['3'].raw.topics[1], subdomainHash, "Wrong Subdomain");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['3'].raw.data.substring(26)), registrant, "Wrong node owner");
      assert.equal(resultRegister.events.SubdomainOwner.returnValues.accountOwner, registrant, "event SubdomainOwner accountOwner mismatch");
      assert.equal(resultRegister.events.SubdomainOwner.returnValues.subdomainHash, subdomainHash, "event SubdomainOwner subdomainHash mismatch");   
      assert.equal(await ens.methods.owner(subdomainHash).call(), registrant, "ENSRegistry owner mismatch");
      assert.equal(await ens.methods.resolver(subdomainHash).call(), PublicResolver.address, "Resolver wrongly defined");
      assert.equal(await ENSSubdomainRegistry.methods.getAccountBalance(subdomainHash).call(), 0, "Free domain accounts shouldn't have balance");
      assert.equal(await ENSSubdomainRegistry.methods.getAccountOwner(subdomainHash).call(), registrant, "Account owner mismatch");
      assert.equal(await PublicResolver.methods.addr(subdomainHash).call(), registrant, "Resolved address not set");      
      const resolverPubKey = await PublicResolver.methods.pubkey(subdomainHash).call();
      assert.equal(resolverPubKey[0], utils.zeroBytes32 , "Unexpected resolved pubkey[0]");
      assert.equal(resolverPubKey[1], utils.zeroBytes32 , "Unexpected resolved pubkey[1]");
    });
    it('should register free status contact code and address resolver-defined subdomain', async () => {
      const registrant = accountsArr[2];
      const subdomain = 'bob2';
      const subdomainHash = namehash.hash(subdomain + '.' + domains.free.name);
      const contactCode = '0x04dbb31252d9bddb4e4d362c7b9c80cba74732280737af97971f42ccbdc716f3f3efb1db366880e52d09b1bfd59842e833f3004088892b7d14b9ce9e957cea9a82';
      const points = utils.generateXY(contactCode);
      const label = web3Utils.sha3(subdomain);
      const node = domains.free.namehash;
      const resultRegister = await ENSSubdomainRegistry.methods.register(
        label,
        node,
        registrant,
        points.x,
        points.y
      ).send({from: registrant}); 
      assert.equal(resultRegister.events['0'].raw.topics[0], '0xce0457fe73731f824cc272376169235128c118b49d344817417c6d108d155e82', "Wrong Event");
      assert.equal(resultRegister.events['0'].raw.topics[1], node, "Wrong Node");
      assert.equal(resultRegister.events['0'].raw.topics[2], label, "Wrong Label");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['0'].raw.data.substring(26)), ENSSubdomainRegistry.address, "Wrong subnode owner");
      assert.equal(resultRegister.events['1'].raw.topics[0], '0x335721b01866dc23fbee8b6b2c7b1e14d6f05c28cd35a2c934239f94095602a0', "Wrong Event");
      assert.equal(resultRegister.events['1'].raw.topics[1], subdomainHash, "Wrong Subdomain");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['1'].raw.data.substring(26)), await ENSSubdomainRegistry.methods.resolver().call(), "Wrong Resolver");
      assert.equal(resultRegister.events['2'].raw.topics[0], '0x52d7d861f09ab3d26239d492e8968629f95e9e318cf0b73bfddc441522a15fd2', "Wrong Event");
      assert.equal(resultRegister.events['2'].raw.topics[1], subdomainHash, "Wrong Subdomain");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['2'].raw.data.substring(26)), registrant, "Wrong address to resolve");
      assert.equal(resultRegister.events['3'].raw.topics[0], '0x1d6f5e03d3f63eb58751986629a5439baee5079ff04f345becb66e23eb154e46', "Wrong Event");
      assert.equal(resultRegister.events['3'].raw.topics[1], subdomainHash, "Wrong Subdomain");
      assert.equal(resultRegister.events['3'].raw.data, points.x.concat(points.y.substr(2)))
      assert.equal(resultRegister.events['4'].raw.topics[0], '0xd4735d920b0f87494915f556dd9b54c8f309026070caea5c737245152564d266', "Wrong Event");
      assert.equal(resultRegister.events['4'].raw.topics[1], subdomainHash, "Wrong Subdomain");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['4'].raw.data.substring(26)), registrant, "Wrong node owner");
      assert.equal(resultRegister.events.SubdomainOwner.returnValues.accountOwner, registrant, "event SubdomainOwner accountOwner mismatch");
      assert.equal(resultRegister.events.SubdomainOwner.returnValues.subdomainHash, subdomainHash, "event SubdomainOwner subdomainHash mismatch");   
      assert.equal(await ens.methods.owner(subdomainHash).call(), registrant, "ENSRegistry owner mismatch");
      assert.equal(await ens.methods.resolver(subdomainHash).call(), PublicResolver.address, "Resolver wrongly defined");
      assert.equal(await ENSSubdomainRegistry.methods.getAccountBalance(subdomainHash).call(), 0, "Free domain accounts shouldn't have balance");
      assert.equal(await ENSSubdomainRegistry.methods.getAccountOwner(subdomainHash).call(), registrant, "Account owner mismatch");
      assert.equal(await PublicResolver.methods.addr(subdomainHash).call(), registrant, "Resolved address not set");      
      const resolverPubKey = await PublicResolver.methods.pubkey(subdomainHash).call();
      const pubKey = utils.keyFromXY(resolverPubKey[0], resolverPubKey[1]);
      assert.equal(pubKey, contactCode, "pubKey does not match contract code");
    });
    it('should register free pubkey only resolver-defined subdomain', async () => {
      const subdomain = 'carlos';
      const registrant = accountsArr[3];
      const subdomainHash = namehash.hash(subdomain + '.' + domains.free.name);
      const contactCode = '0x04dbb31252d9bddb4e4d362c7b9c80cba74732280737af97971f42ccbdc716f3f3efb1db366880e52d09b1bfd59842e833f3004088892b7d14b9ce9e957cea9a82';
      const points = utils.generateXY(contactCode);
      const label = web3Utils.sha3(subdomain);
      const node = domains.free.namehash;
      const resultRegister = await ENSSubdomainRegistry.methods.register(
        web3Utils.sha3(subdomain),
        domains.free.namehash,
        utils.zeroAddress,
        points.x,
        points.y
      ).send({from: registrant});
      assert.equal(resultRegister.events['0'].raw.topics[0], '0xce0457fe73731f824cc272376169235128c118b49d344817417c6d108d155e82', "Wrong Event");
      assert.equal(resultRegister.events['0'].raw.topics[1], node, "Wrong Node");
      assert.equal(resultRegister.events['0'].raw.topics[2], label, "Wrong Label");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['0'].raw.data.substring(26)), ENSSubdomainRegistry.address, "Wrong subnode owner");
      assert.equal(resultRegister.events['1'].raw.topics[0], '0x335721b01866dc23fbee8b6b2c7b1e14d6f05c28cd35a2c934239f94095602a0', "Wrong Event");
      assert.equal(resultRegister.events['1'].raw.topics[1], subdomainHash, "Wrong Subdomain");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['1'].raw.data.substring(26)), PublicResolver.address, "Wrong Resolver");
      assert.equal(resultRegister.events['2'].raw.topics[0], '0x1d6f5e03d3f63eb58751986629a5439baee5079ff04f345becb66e23eb154e46', "Wrong Event");
      assert.equal(resultRegister.events['2'].raw.topics[1], subdomainHash, "Wrong Subdomain");
      assert.equal(resultRegister.events['2'].raw.data, points.x.concat(points.y.substr(2)))
      assert.equal(resultRegister.events['3'].raw.topics[0], '0xd4735d920b0f87494915f556dd9b54c8f309026070caea5c737245152564d266', "Wrong Event");
      assert.equal(resultRegister.events['3'].raw.topics[1], subdomainHash, "Wrong Subdomain");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['3'].raw.data.substring(26)), registrant, "Wrong node owner");
      assert.equal(resultRegister.events.SubdomainOwner.returnValues.accountOwner, registrant, "event SubdomainOwner accountOwner mismatch");
      assert.equal(resultRegister.events.SubdomainOwner.returnValues.subdomainHash, subdomainHash, "event SubdomainOwner subdomainHash mismatch");   
      assert.equal(await ens.methods.owner(subdomainHash).call(), registrant, "ENSRegistry owner mismatch");
      assert.equal(await ens.methods.resolver(subdomainHash).call(), PublicResolver.address, "Resolver wrongly defined");
      assert.equal(await ENSSubdomainRegistry.methods.getAccountBalance(subdomainHash).call(), 0, "Free domain accounts shouldn't have balance");
      assert.equal(await ENSSubdomainRegistry.methods.getAccountOwner(subdomainHash).call(), registrant, "Account owner mismatch");
      assert.equal(await PublicResolver.methods.addr(subdomainHash).call(), utils.zeroAddress, "Resolved address not set");      
      const resolverPubKey = await PublicResolver.methods.pubkey(subdomainHash).call();
      const pubKey = utils.keyFromXY(resolverPubKey[0], resolverPubKey[1]);
      assert.equal(pubKey, contactCode, "pubKey does not match contract code");
    });
    it('should register empty subdomain with token cost', async () => {
      const registrant = accountsArr[5];
      const subdomain = 'erin';
      const subdomainHash = namehash.hash(subdomain + '.' + domains.paid.name);
      const domainPrice = await ENSSubdomainRegistry.methods.getPrice(domains.paid.namehash).call()
      const label = web3Utils.sha3(subdomain);
      const node = domains.paid.namehash;
      await TestToken.methods.mint(domainPrice).send({from: registrant});
      const initialRegistrantBalance = await TestToken.methods.balanceOf(registrant).call();
      const initialRegistryBalance = await TestToken.methods.balanceOf(ENSSubdomainRegistry.address).call();
      await TestToken.methods.approve(ENSSubdomainRegistry.address, domainPrice).send({from: registrant});  
      const resultRegister = await ENSSubdomainRegistry.methods.register(
        web3Utils.sha3(subdomain),
        domains.paid.namehash,
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      assert.equal(resultRegister.events['0'].raw.topics[0], '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', "Wrong Event");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['0'].raw.topics[1].substring(26)), registrant, "Wrong subnode owner");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['0'].raw.topics[2].substring(26)), ENSSubdomainRegistry.address, "Wrong subnode owner");
      assert.equal(resultRegister.events['1'].raw.topics[0], '0xce0457fe73731f824cc272376169235128c118b49d344817417c6d108d155e82', "Wrong Event");
      assert.equal(resultRegister.events['1'].raw.topics[1], node, "Wrong Node");
      assert.equal(resultRegister.events['1'].raw.topics[2], label, "Wrong Label");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['1'].raw.data.substring(26)), registrant, "Wrong subnode owner");
      assert.equal(resultRegister.events.SubdomainOwner.returnValues.accountOwner, registrant, "event SubdomainOwner accountOwner mismatch");
      assert.equal(resultRegister.events.SubdomainOwner.returnValues.subdomainHash, subdomainHash, "event SubdomainOwner subdomainHash mismatch");   
      assert.equal(await ens.methods.owner(subdomainHash).call(), registrant, "ENSRegistry owner mismatch");
      assert.equal(await ens.methods.resolver(subdomainHash).call(), utils.zeroAddress, "Resolver wrongly defined");
      assert.equal(await ENSSubdomainRegistry.methods.getAccountBalance(subdomainHash).call(), domainPrice, "Registry subdomain account balance wrong");
      assert.equal(await ENSSubdomainRegistry.methods.getAccountOwner(subdomainHash).call(), registrant, "Account owner mismatch");
      assert.equal(await TestToken.methods.balanceOf(registrant).call(), +initialRegistrantBalance-domainPrice, "User final balance wrong")
      assert.equal(await TestToken.methods.balanceOf(ENSSubdomainRegistry.address).call(), (+initialRegistryBalance)+(+domainPrice), "Registry final balance wrong")
    });
  });

  describe('release()', function() {
    it('should not release subdomain due delay', async () => {
      let registrant = accountsArr[6];
      let subdomain = 'mistaker';
      await ENSSubdomainRegistry.methods.register(
        web3Utils.sha3(subdomain),
        domains.free.namehash,
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      let failed;
      try{
        await ENSSubdomainRegistry.methods.release(
          web3Utils.sha3(subdomain),
          domains.free.namehash
        ).send({from: registrant});  
        failed = false;
      } catch(e){
        failed = true;
      }
      assert(failed, "Released after delay period");
    });
    it('should release free subdomain', async () => {
      let registrant = accountsArr[6];
      let subdomain = 'frank';
      let subdomainHash = namehash.hash(subdomain + '.' + domains.free.name);

      await ENSSubdomainRegistry.methods.register(
        web3Utils.sha3(subdomain),
        domains.free.namehash,
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      const releaseDelay = await ENSSubdomainRegistry.methods.releaseDelay().call();
      await utils.increaseTime(releaseDelay)
      await utils.increaseTime(1000)
      const initialRegistrantBalance = await TestToken.methods.balanceOf(registrant).call();
      const initialRegistryBalance = await TestToken.methods.balanceOf(ENSSubdomainRegistry.address).call();
      await utils.increaseTime(1000)
      const resultRelease = await ENSSubdomainRegistry.methods.release(
        web3Utils.sha3(subdomain),
        domains.free.namehash
      ).send({from: registrant});
      //TODO: check events
      assert.equal(await ens.methods.owner(subdomainHash).call(), utils.zeroAddress, "Not released name ownship");
      assert.equal(await TestToken.methods.balanceOf(registrant).call(), initialRegistrantBalance, "Registrant token balance unexpectectly changed")
      assert.equal(await TestToken.methods.balanceOf(ENSSubdomainRegistry.address).call(), initialRegistryBalance, "Registry token balance unexpectectly changed")
    });
    it('should release subdomain with cost', async () => {;
      const registrant = accountsArr[6];
      const subdomain = 'frank';
      const subdomainHash = namehash.hash(subdomain + '.' + domains.paid.name);
      const labelHash = web3Utils.sha3(subdomain);
      const domainPrice = await ENSSubdomainRegistry.methods.getPrice(domains.paid.namehash).call()
      await TestToken.methods.mint(domainPrice).send({from: registrant});
      await TestToken.methods.approve(ENSSubdomainRegistry.address, domainPrice).send({from: registrant});
      await ENSSubdomainRegistry.methods.register(
        labelHash,
        domains.paid.namehash,
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      const releaseDelay = await ENSSubdomainRegistry.methods.releaseDelay().call();
      await utils.increaseTime(releaseDelay)
      await utils.increaseTime(1000)
      const initialAccountBalance = await ENSSubdomainRegistry.methods.getAccountBalance(subdomainHash).call();
      const initialRegistrantBalance = await TestToken.methods.balanceOf(registrant).call();
      const initialRegistryBalance = await TestToken.methods.balanceOf(ENSSubdomainRegistry.address).call();
      await utils.increaseTime(1000)
      const resultRelease = await ENSSubdomainRegistry.methods.release(
        web3Utils.sha3(subdomain),
        domains.paid.namehash
      ).send({from: registrant});
      //TODO: check events
      assert.equal(await ENSSubdomainRegistry.methods.getAccountBalance(subdomainHash).call(), 0, "Final balance didnt zeroed");
      assert.equal(await TestToken.methods.balanceOf(registrant).call(), (+initialRegistrantBalance)+(+initialAccountBalance), "Releaser token balance didnt increase")
      assert.equal(await TestToken.methods.balanceOf(ENSSubdomainRegistry.address).call(), (+initialRegistryBalance)-(+initialAccountBalance), "Registry token balance didnt decrease")
    });
    it('should release transfered subdomain with cost', async () => {
      let registrant = accountsArr[7];
      let subdomain = 'grace';
      let subdomainHash = namehash.hash(subdomain + '.' + domains.paid.name);
      let labelHash = web3Utils.sha3(subdomain);
      let newOwner = accountsArr[8];
      let domainPrice = await ENSSubdomainRegistry.methods.getPrice(domains.paid.namehash).call()
      await TestToken.methods.mint(domainPrice).send({from: registrant});
      await TestToken.methods.approve(ENSSubdomainRegistry.address, domainPrice).send({from: registrant});
      await ENSSubdomainRegistry.methods.register(
        labelHash,
        domains.paid.namehash,
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      await ens.methods.setOwner(subdomainHash, newOwner).send({from: registrant});
      let releaseDelay = await ENSSubdomainRegistry.methods.releaseDelay().call();
      await utils.increaseTime(releaseDelay)
      await utils.increaseTime(1000)
      let initialAccountBalance = await ENSSubdomainRegistry.methods.getAccountBalance(subdomainHash).call();
      let initialRegistrantBalance = await TestToken.methods.balanceOf(newOwner).call();
      let initialRegistryBalance = await TestToken.methods.balanceOf(ENSSubdomainRegistry.address).call();
      await utils.increaseTime(1000)
      let resultRelease = await ENSSubdomainRegistry.methods.release(
        web3Utils.sha3(subdomain),
        domains.paid.namehash
      ).send({from: newOwner});
      //TODO: check events
      assert.equal(await ENSSubdomainRegistry.methods.getAccountBalance(subdomainHash).call(), 0, "Final balance didnt zeroed");
      assert.equal(await TestToken.methods.balanceOf(newOwner).call(), (+initialRegistrantBalance)+(+initialAccountBalance), "New owner token balance didnt increase")
      assert.equal(await TestToken.methods.balanceOf(ENSSubdomainRegistry.address).call(), (+initialRegistryBalance)-(+initialAccountBalance), "Registry token balance didnt decrease")
    });
    it('should release moved subdomain account balance by funds owner', async () => {
      const domain = domains.temp;
      await ENSSubdomainRegistry.methods.setDomainPrice(domain.namehash, domain.price).send({from: accountsArr[0]});
      const registrant = accountsArr[5];
      const subdomain = 'hardhead';
      const subdomainHash = namehash.hash(subdomain + '.' + domain.name);
      const domainPrice = await ENSSubdomainRegistry.methods.getPrice(domain.namehash).call()
      const label = web3Utils.sha3(subdomain);
      const node = domain.namehash;
      await TestToken.methods.mint(domainPrice).send({from: registrant});
      await TestToken.methods.approve(ENSSubdomainRegistry.address, domainPrice).send({from: registrant});  
      await ENSSubdomainRegistry.methods.register(
        label,
        node,
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      let initialAccountBalance = await ENSSubdomainRegistry.methods.getAccountBalance(subdomainHash).call();
      const initialRegistrantBalance = await TestToken.methods.balanceOf(registrant).call();
      const initialRegistryBalance = await TestToken.methods.balanceOf(ENSSubdomainRegistry.address).call();
      await ENSSubdomainRegistry.methods.moveDomain(UpdatedENSSubdomainRegistry.address, domain.namehash).send();
      const resultRelease = await ENSSubdomainRegistry.methods.release(
        label,
        node
      ).send({from: registrant});
      //TODO: verify events
      assert.equal(await TestToken.methods.balanceOf(registrant).call(), (+initialRegistrantBalance)+(+initialAccountBalance), "New owner token balance didnt increase")
      assert.equal(await TestToken.methods.balanceOf(ENSSubdomainRegistry.address).call(), (+initialRegistryBalance)-(+initialAccountBalance), "Registry token balance didnt decrease")
    });
  });
  
  describe('updateAccountOwner()', function() {
    it('should update subdomain funds owner', async () => {
      let subdomain = 'heidi';
      let labelHash = web3Utils.sha3(subdomain);
      let registrant = accountsArr[8];
      let newOwner = accountsArr[9];
      let subdomainHash = namehash.hash(subdomain + '.' + domains.paid.name);
      let domainPrice = await ENSSubdomainRegistry.methods.getPrice(domains.paid.namehash).call()
      await TestToken.methods.mint(domainPrice).send({from: registrant});
      await TestToken.methods.approve(ENSSubdomainRegistry.address, domainPrice).send({from: registrant});
      await ENSSubdomainRegistry.methods.register(
        labelHash,
        domains.paid.namehash,
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      await ens.methods.setOwner(subdomainHash, newOwner).send({from: registrant});
      let resultUpdateOwner = await ENSSubdomainRegistry.methods.updateAccountOwner(
        labelHash,
        domains.paid.namehash
      ).send({from: newOwner});
      //TODO: check events
      assert.equal(await ENSSubdomainRegistry.methods.getAccountOwner(subdomainHash).call(), newOwner, "Backup owner not updated");
    });
  });
  
  describe('slashInvalidSubdomain()', function() {
    it('should slash invalid subdomain', async () => {
      let subdomain = 'alicé';
      let subdomainHash = namehash.hash(subdomain + '.' + domains.free.name);
      let registrant = accountsArr[1];
      await ENSSubdomainRegistry.methods.register(
        web3Utils.sha3(subdomain),
        domains.free.namehash,
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      assert.equal(await ens.methods.owner(subdomainHash).call(), registrant);
      assert.notEqual(await ENSSubdomainRegistry.methods.getCreationTime(subdomainHash).call(), 0);
      await ENSSubdomainRegistry.methods.slashInvalidSubdomain(web3Utils.toHex(subdomain), domains.free.namehash, 4).send()
      //TODO: check events
      assert.equal(await ENSSubdomainRegistry.methods.getCreationTime(subdomainHash).call(), 0);
      assert.equal(await ens.methods.owner(subdomainHash).call(), utils.zeroAddress);
    });
    it('should not slash valid subdomain', async () => {
      let subdomain = 'legituser';
      let subdomainHash = namehash.hash(subdomain + '.' + domains.free.name);
      let registrant = accountsArr[1];
      await ENSSubdomainRegistry.methods.register(
        web3Utils.sha3(subdomain),
        domains.free.namehash,
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});    
      let failed;
      try{
        await ENSSubdomainRegistry.methods.slashInvalidSubdomain(web3Utils.toHex(subdomain), domains.free.namehash, 4).send()
        failed = false;
      } catch(e){
        failed = true;
      }
      assert(failed, "Was slashed anyway");
    });
  });

  describe('slashReservedSubdomain()', function() {
    it('should slash reserved name subdomain', async () => {
      let subdomain = reservedNames[0];
      let subdomainHash = namehash.hash(subdomain + '.' + domains.free.name);
      let registrant = accountsArr[1];
      await ENSSubdomainRegistry.methods.register(
        web3Utils.sha3(subdomain),
        domains.free.namehash,
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      assert.equal(await ens.methods.owner(subdomainHash).call(), registrant);
      const proof = merkleTree.getHexProof(reservedNames[0]);
      result = await ENSSubdomainRegistry.methods.slashReservedSubdomain(web3Utils.toHex(subdomain), domains.free.namehash, 0, proof).send()  
      assert.equal(await ens.methods.owner(subdomainHash).call(), utils.zeroAddress);
    });
  });

  describe('slashSmallSubdomain()', function() {
    it('should not slash big subdomain', async() =>{
      let subdomain = '1234567890';
      let subdomainHash = namehash.hash(subdomain + '.' + domains.free.name);
      let registrant = accountsArr[1];
      await ENSSubdomainRegistry.methods.register(
        web3Utils.sha3(subdomain),
        domains.free.namehash,
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      let failed;
      try{
        await ENSSubdomainRegistry.methods.slashSmallSubdomain(web3Utils.toHex(subdomain), domains.free.namehash).send()    
        failed = false;
      } catch(e){
        failed = true;
      }
      assert(failed, "Was slashed anyway");
    })
    it('should slash small subdomain', async () => {
      let subdomain = 'a';
      let subdomainHash = namehash.hash(subdomain + '.' + domains.free.name);
      let registrant = accountsArr[1];
      await ENSSubdomainRegistry.methods.register(
        web3Utils.sha3(subdomain),
        domains.free.namehash,
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});  
      assert.equal(await ens.methods.owner(subdomainHash).call(), registrant);
      result = await ENSSubdomainRegistry.methods.slashSmallSubdomain(web3Utils.toHex(subdomain), domains.free.namehash).send()    
      assert.equal(await ens.methods.owner(subdomainHash).call(), utils.zeroAddress);
    });
  });
  describe('slashAddressLikeSubdomain()', function() {
    it('should slash subdomain that starts with 0x and is 12 of lenght or bigger', async () => {
      let subdomain = "0xc6b95bd26123";
      let userlabelHash = "0xe311c0592b075c30277c679f0daea74ee1727547efa522fd28d20a8f2c3e435b"; //sha3("0xc6b95bd26123")
      let subdomainHash = "0x5fcd61e83fda60beb7c9bff8e0e26a6f975a5154ff2e6f5464dc97571c95cdd4"; //namehash("0xc6b95bd26123.freedomain.eth")
      let domainnameHash = "0x297836a76312224372ac04e26dd23d1294bb8256598ec113ecc52735f826beff"; //namehash("freedomain.eth")
      let registrant = accountsArr[1];
      let result = await ENSSubdomainRegistry.methods.register(
        userlabelHash,
        domainnameHash,
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      assert.equal(await ens.methods.owner(subdomainHash).call(), registrant);
      result = await ENSSubdomainRegistry.methods.slashAddressLikeSubdomain(subdomain, domainnameHash).send()    
      assert.equal(await ens.methods.owner(subdomainHash).call(), utils.zeroAddress);
    });
    it('should not slash subdomain that starts with 0x but is smaller then 12', async () => {
      let subdomain = "0xc6b95bd26";
      let userlabelHash = "0x59bf8d16c517a40a5dacc3471abd002f3bc0850a13e930e4bee49070a58517e8"; //sha3("0xc6b95bd26")
      let subdomainHash = "0x6f15e192c1c4537c2d774431219ed42efc6be95efe362104ba546eb574f3f1e5"; //namehash("0xc6b95bd26.freedomain.eth")
      let domainnameHash = "0x297836a76312224372ac04e26dd23d1294bb8256598ec113ecc52735f826beff"; //namehash("freedomain.eth")
      let registrant = accountsArr[1];
      await ENSSubdomainRegistry.methods.register(
        userlabelHash,
        domainnameHash,
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      let failed;
      try{
        result = await ENSSubdomainRegistry.methods.slashAddressLikeSubdomain(subdomain, domainnameHash).send()    
        failed = false;
      } catch(e){
        failed = true;
      }
      assert(failed, "Was slashed anyway");
    });
    it('should not slash subdomain that dont starts 0x and is bigger than 12', async () => {
      const subdomain = "0a002322c6b95bd26";
      const userlabelHash = "0xe4769e5c31ff61ac50dce20559a4411a4ca45d94c733cbeda7ab9f28ed75cef1"; //sha3("0a002322c6b95bd26")
      const subdomainHash = "0x549a8b62103d19b66f70bee21176514340094253a92123609c1df25b0812d40c"; //namehash("0a002322c6b95bd26.freedomain.eth")
      const domainnameHash = "0x297836a76312224372ac04e26dd23d1294bb8256598ec113ecc52735f826beff"; //namehash("freedomain.eth") 
      const registrant = accountsArr[1];
      await ENSSubdomainRegistry.methods.register(
        userlabelHash,
        domainnameHash,
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      let failed;
      try{
        await ENSSubdomainRegistry.methods.slashAddressLikeSubdomain(subdomain, domainnameHash).send()    
        failed = false;
      } catch(e){
        failed = true;
      }
      assert(failed, "Was slashed anyway");     
    });
  });
  describe('slashSubdomain()', function() {
    it('should slash a paid subdomain and get funds from registrant', async () => {
      const subdomain = 'b';
      const subdomainHash = namehash.hash(subdomain + '.' + domains.paid.name);
      const registrant = accountsArr[1];
      const slasher = accountsArr[2];
      const domainPrice = await ENSSubdomainRegistry.methods.getPrice(domains.paid.namehash).call()
      await TestToken.methods.mint(domainPrice).send({from: registrant});
      await TestToken.methods.approve(ENSSubdomainRegistry.address, domainPrice).send({from: registrant});
      await ENSSubdomainRegistry.methods.register(
        web3Utils.sha3(subdomain),
        domains.paid.namehash,
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      assert.equal(await ens.methods.owner(subdomainHash).call(), registrant);
      const initialSlasherBalance = await TestToken.methods.balanceOf(slasher).call();
      await ENSSubdomainRegistry.methods.slashSmallSubdomain(web3Utils.toHex(subdomain), domains.paid.namehash).send({from: slasher})
      //TODO: check events
      assert.equal(await TestToken.methods.balanceOf(slasher).call(), (+initialSlasherBalance)+(+domainPrice));    
      assert.equal(await ens.methods.owner(subdomainHash).call(), utils.zeroAddress);
    });
  });
  
  describe('moveDomain()', function() {
    it('should move free domain to new registry and migrate', async () => {
      const resultMoveDomain = await ENSSubdomainRegistry.methods.moveDomain(UpdatedENSSubdomainRegistry.address, domains.free.namehash).send();
      //TODO: check events
      assert.equal(await ens.methods.owner(domains.free.namehash).call(), UpdatedENSSubdomainRegistry.address, "domain ownership not moved correctly")
    });
    it('should move paid domain to new registry and migrate', async () => {
      const price = await ENSSubdomainRegistry.methods.getPrice(domains.paid.namehash).call()
      const result = await ENSSubdomainRegistry.methods.moveDomain(UpdatedENSSubdomainRegistry.address, domains.paid.namehash).send();
      //TODO: check events
      assert.equal(await ens.methods.owner(domains.paid.namehash).call(), UpdatedENSSubdomainRegistry.address, "domain ownership not moved correctly")
      assert.equal(await UpdatedENSSubdomainRegistry.methods.getPrice(domains.paid.namehash).call(), price, "updated registry didnt migrated price")
    });
  });

  describe('moveAccount()', function() {
    it('should move free subdomain to new registry by funds owner', async () => {
      const subdomain = 'alice';
      const subdomainHash = namehash.hash(subdomain + '.' + domains.free.name);
      const registrant = accountsArr[1];
      const label = web3Utils.sha3(subdomain);
      const node = domains.free.namehash;
      const creationTime = await ENSSubdomainRegistry.methods.getCreationTime(subdomainHash).call();
      assert.notEqual(creationTime, 0);
      assert.equal(await UpdatedENSSubdomainRegistry.methods.getCreationTime(subdomainHash).call(), 0);
      const result = await ENSSubdomainRegistry.methods.moveAccount(label,node).send({from: registrant});
      assert.equal(await ENSSubdomainRegistry.methods.getCreationTime(subdomainHash).call(), 0);
      assert.equal(await UpdatedENSSubdomainRegistry.methods.getCreationTime(subdomainHash).call(), creationTime);
    });
    it('should move paid subdomain to new registry by funds owner', async () => {
      const registrant = accountsArr[5];
      const subdomain = 'erin';
      const subdomainHash = namehash.hash(subdomain + '.' + domains.paid.name);
      const label = web3Utils.sha3(subdomain);
      const node = domains.paid.namehash;
      const accountBalance = await ENSSubdomainRegistry.methods.getAccountBalance(subdomainHash).call()
      assert.notEqual(accountBalance, 0);
      const initialRegistryBalance = await TestToken.methods.balanceOf(ENSSubdomainRegistry.address).call();
      const initialUpdatedRegistryBalance = await TestToken.methods.balanceOf(UpdatedENSSubdomainRegistry.address).call();
      const creationTime = await ENSSubdomainRegistry.methods.getCreationTime(subdomainHash).call();
      assert.notEqual(creationTime, 0);
      assert.equal(await UpdatedENSSubdomainRegistry.methods.getCreationTime(subdomainHash).call(), 0);
      const result = await ENSSubdomainRegistry.methods.moveAccount(label,node).send({from: registrant});
      assert.equal(await ENSSubdomainRegistry.methods.getCreationTime(subdomainHash).call(), 0);
      assert.equal(await UpdatedENSSubdomainRegistry.methods.getCreationTime(subdomainHash).call(), creationTime);
      assert.equal(await TestToken.methods.balanceOf(ENSSubdomainRegistry.address).call(), (+initialRegistryBalance)-(+accountBalance))
      assert.equal(await TestToken.methods.balanceOf(UpdatedENSSubdomainRegistry.address).call(), (+initialUpdatedRegistryBalance)+(+accountBalance))
    });
  });

});
