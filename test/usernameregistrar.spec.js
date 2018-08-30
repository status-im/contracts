const utils = require('../utils/testUtils.js');
const web3Utils = require('web3-utils');
const namehash = require('eth-ens-namehash');
const TestToken = require('Embark/contracts/TestToken');
const ENSRegistry = require('Embark/contracts/ENSRegistry');
const PublicResolver = require('Embark/contracts/PublicResolver');
const UsernameRegistrar = require('Embark/contracts/UsernameRegistrar');
const { MerkleTree } = require('../utils/merkleTree.js');
const { reservedNames } = require('../config/ens-usernames/reservedNames')
const registry = {
  name: 'stateofus',
  registry:  'stateofus.eth',
  label: web3Utils.sha3('stateofus'),
  namehash: namehash.hash('stateofus.eth'),
  price: 100000000
}

const dummyRegistry = {
  name: 'dummyreg',
  registry:  'dummyreg.eth',
  label: web3Utils.sha3('dummyreg'),
  namehash: namehash.hash('dummyreg.eth'),
  price: 100000000
}

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
  "UsernameRegistrar": {
    "args": [
      "$TestToken",
      "$ENSRegistry",
      "$PublicResolver",
      registry.namehash,
      "3", 
      merkleRoot,
      "0x0"
    ],
    "onDeploy": [
      "ENSRegistry.methods.setSubnodeOwner('0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae', '"+registry.label+"', UsernameRegistrar.address).send()",
    ]
  },
  "UpdatedUsernameRegistrar": {
    "instanceOf" : "UsernameRegistrar",
    "args": [
      "$TestToken",
      "$ENSRegistry",
      "$PublicResolver",
      registry.namehash,
      "3", 
      merkleRoot,
      "$UsernameRegistrar"
    ]
  },
  "DummyUsernameRegistrar": {
    "instanceOf" : "UsernameRegistrar",
    "args": [
      "$TestToken",
      "$ENSRegistry",
      "$PublicResolver",
      dummyRegistry.namehash,
      "3", 
      merkleRoot,
      "0x0"
    ],
    "onDeploy": [
      "ENSRegistry.methods.setSubnodeOwner('0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae', '"+dummyRegistry.label+"', DummyUsernameRegistrar.address).send()",
    ]
  },
  "UpdatedDummyUsernameRegistrar": {
    "instanceOf" : "UsernameRegistrar",
    "args": [
      "$TestToken",
      "$ENSRegistry",
      "$PublicResolver",
      dummyRegistry.namehash,
      "3", 
      merkleRoot,
      "$DummyUsernameRegistrar"
    ]
  }

};

config({ contracts: contractsConfig });

contract('UsernameRegistrar', function () {
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

  describe('activate(uint256)', function() {
    it('should activate registry', async () => {
      const initialPrice = 100
      const resultSetRegistryPrice = await UsernameRegistrar.methods.activate(initialPrice).send({from: accountsArr[0]});
      assert.equal(resultSetRegistryPrice.events.RegistryPrice.returnValues.price, initialPrice, "event RegistryPrice wrong price");
      assert.equal(await UsernameRegistrar.methods.state().call(), 1, "Wrong registry state")
      assert.equal(await UsernameRegistrar.methods.price().call(), initialPrice, "Wrong registry price")
    });
  });

  describe('updateRegistryPrice()', function() {
    it('should change registry price', async () => {
      const newPrice = registry.price;
      const resultUpdateRegistryPrice = await UsernameRegistrar.methods.updateRegistryPrice(newPrice).send({from: accountsArr[0]});
      assert.equal(resultUpdateRegistryPrice.events.RegistryPrice.returnValues.price, registry.price, "event RegistryPrice wrong price");
      assert.equal(await UsernameRegistrar.methods.state().call(), 1, "Wrong registry state")
      assert.equal(await UsernameRegistrar.methods.price().call(), newPrice, "Wrong registry price")
    });
  });

  describe('register()', function() {
    it('should register username', async () => {
      const registrant = accountsArr[5];
      const username = 'erin';
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      const label = web3Utils.sha3(username);
      const registryPrice = await UsernameRegistrar.methods.getPrice().call()
      await TestToken.methods.mint(registry.price).send({from: registrant});
      const initialRegistrantBalance = await TestToken.methods.balanceOf(registrant).call();
      const initialRegistryBalance = await TestToken.methods.balanceOf(UsernameRegistrar.address).call();
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});  
      const resultRegister = await UsernameRegistrar.methods.register(
        web3Utils.sha3(username),
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      assert.equal(resultRegister.events['0'].raw.topics[0], '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', "Wrong Event");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['0'].raw.topics[1].substring(26)), registrant, "Wrong subnode owner");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['0'].raw.topics[2].substring(26)), UsernameRegistrar.address, "Wrong subnode owner");
      assert.equal(resultRegister.events['1'].raw.topics[0], '0xce0457fe73731f824cc272376169235128c118b49d344817417c6d108d155e82', "Wrong Event");
      assert.equal(resultRegister.events['1'].raw.topics[1], registry.namehash, "Wrong Node");
      assert.equal(resultRegister.events['1'].raw.topics[2], label, "Wrong Label");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['1'].raw.data.substring(26)), registrant, "Wrong subnode owner");
      assert.equal(resultRegister.events.UsernameOwner.returnValues.owner, registrant, "event UsernameOwner owner mismatch");
      assert.equal(resultRegister.events.UsernameOwner.returnValues.nameHash, usernameHash, "event UsernameOwner usernameHash mismatch");   
      assert.equal(await ens.methods.owner(usernameHash).call(), registrant, "ENSRegistry owner mismatch");
      assert.equal(await ens.methods.resolver(usernameHash).call(), utils.zeroAddress, "Resolver wrongly defined");
      assert.equal(await UsernameRegistrar.methods.getAccountBalance(label).call(), registryPrice, "Registry username account balance wrong");
      assert.equal(await UsernameRegistrar.methods.getAccountOwner(label).call(), registrant, "Account owner mismatch");
      assert.equal(await TestToken.methods.balanceOf(registrant).call(), +initialRegistrantBalance-registryPrice, "User final balance wrong")
      assert.equal(await TestToken.methods.balanceOf(UsernameRegistrar.address).call(), (+initialRegistryBalance)+(+registry.price), "Registry final balance wrong")
    });
    it('should register username only resolveing address  ', async () => {
      const registrant = accountsArr[2];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});  
      const username = 'bob';
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      const label = web3Utils.sha3(username);
      const resultRegister = await UsernameRegistrar.methods.register(
        web3Utils.sha3(username),

        registrant,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      assert.equal(resultRegister.events['1'].raw.topics[0], '0xce0457fe73731f824cc272376169235128c118b49d344817417c6d108d155e82', "Wrong Event");
      assert.equal(resultRegister.events['1'].raw.topics[1], registry.namehash, "Wrong Node");
      assert.equal(resultRegister.events['1'].raw.topics[2], label, "Wrong Label");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['1'].raw.data.substring(26)), UsernameRegistrar.address, "Wrong subnode owner");
      assert.equal(resultRegister.events['2'].raw.topics[0], '0x335721b01866dc23fbee8b6b2c7b1e14d6f05c28cd35a2c934239f94095602a0', "Wrong Event");
      assert.equal(resultRegister.events['2'].raw.topics[1], usernameHash, "Wrong Username");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['2'].raw.data.substring(26)), PublicResolver.address, "Wrong Resolver");
      assert.equal(resultRegister.events['3'].raw.topics[0], '0x52d7d861f09ab3d26239d492e8968629f95e9e318cf0b73bfddc441522a15fd2', "Wrong Event");
      assert.equal(resultRegister.events['3'].raw.topics[1], usernameHash, "Wrong Username");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['3'].raw.data.substring(26)), registrant, "Wrong address to resolve");
      assert.equal(resultRegister.events['4'].raw.topics[0], '0xd4735d920b0f87494915f556dd9b54c8f309026070caea5c737245152564d266', "Wrong Event");
      assert.equal(resultRegister.events['4'].raw.topics[1], usernameHash, "Wrong Username");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['4'].raw.data.substring(26)), registrant, "Wrong registry.namehash owner");
      assert.equal(resultRegister.events.UsernameOwner.returnValues.owner, registrant, "event UsernameOwner owner mismatch");
      assert.equal(resultRegister.events.UsernameOwner.returnValues.nameHash, usernameHash, "event UsernameOwner usernameHash mismatch");   
      assert.equal(await ens.methods.owner(usernameHash).call(), registrant, "ENSRegistry owner mismatch");
      assert.equal(await ens.methods.resolver(usernameHash).call(), PublicResolver.address, "Resolver wrongly defined");
      assert.equal(await UsernameRegistrar.methods.getAccountBalance(label).call(), registry.price, "Wrong account balance");
      assert.equal(await UsernameRegistrar.methods.getAccountOwner(label).call(), registrant, "Account owner mismatch");
      assert.equal(await PublicResolver.methods.addr(usernameHash).call(), registrant, "Resolved address not set");      
      const resolverPubKey = await PublicResolver.methods.pubkey(usernameHash).call();
      assert.equal(resolverPubKey[0], utils.zeroBytes32 , "Unexpected resolved pubkey[0]");
      assert.equal(resolverPubKey[1], utils.zeroBytes32 , "Unexpected resolved pubkey[1]");
    });
    it('should register username with only status contact', async () => {
      const username = 'carlos';
      const registrant = accountsArr[3];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});  
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      const contactCode = '0x04dbb31252d9bddb4e4d362c7b9c80cba74732280737af97971f42ccbdc716f3f3efb1db366880e52d09b1bfd59842e833f3004088892b7d14b9ce9e957cea9a82';
      const points = utils.generateXY(contactCode);
      const label = web3Utils.sha3(username);
      const resultRegister = await UsernameRegistrar.methods.register(
        web3Utils.sha3(username),
        utils.zeroAddress,
        points.x,
        points.y
      ).send({from: registrant});
      assert.equal(resultRegister.events['1'].raw.topics[0], '0xce0457fe73731f824cc272376169235128c118b49d344817417c6d108d155e82', "Wrong Event");
      assert.equal(resultRegister.events['1'].raw.topics[1], registry.namehash, "Wrong Node");
      assert.equal(resultRegister.events['1'].raw.topics[2], label, "Wrong Label");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['1'].raw.data.substring(26)), UsernameRegistrar.address, "Wrong subnode owner");
      assert.equal(resultRegister.events['2'].raw.topics[0], '0x335721b01866dc23fbee8b6b2c7b1e14d6f05c28cd35a2c934239f94095602a0', "Wrong Event");
      assert.equal(resultRegister.events['2'].raw.topics[1], usernameHash, "Wrong Username");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['2'].raw.data.substring(26)), PublicResolver.address, "Wrong Resolver");
      assert.equal(resultRegister.events['3'].raw.topics[0], '0x1d6f5e03d3f63eb58751986629a5439baee5079ff04f345becb66e23eb154e46', "Wrong Event");
      assert.equal(resultRegister.events['3'].raw.topics[1], usernameHash, "Wrong Username");
      assert.equal(resultRegister.events['3'].raw.data, points.x.concat(points.y.substr(2)))
      assert.equal(resultRegister.events['4'].raw.topics[0], '0xd4735d920b0f87494915f556dd9b54c8f309026070caea5c737245152564d266', "Wrong Event");
      assert.equal(resultRegister.events['4'].raw.topics[1], usernameHash, "Wrong Username");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['4'].raw.data.substring(26)), registrant, "Wrong registry.namehash owner");
      assert.equal(resultRegister.events.UsernameOwner.returnValues.owner, registrant, "event UsernameOwner owner mismatch");
      assert.equal(resultRegister.events.UsernameOwner.returnValues.nameHash, usernameHash, "event UsernameOwner usernameHash mismatch");   
      assert.equal(await ens.methods.owner(usernameHash).call(), registrant, "ENSRegistry owner mismatch");
      assert.equal(await ens.methods.resolver(usernameHash).call(), PublicResolver.address, "Resolver wrongly defined");
      assert.equal(await UsernameRegistrar.methods.getAccountBalance(label).call(), registry.price, "Wrong account balance");
      assert.equal(await UsernameRegistrar.methods.getAccountOwner(label).call(), registrant, "Account owner mismatch");
      assert.equal(await PublicResolver.methods.addr(usernameHash).call(), utils.zeroAddress, "Resolved address not set");      
      const resolverPubKey = await PublicResolver.methods.pubkey(usernameHash).call();
      const pubKey = utils.keyFromXY(resolverPubKey[0], resolverPubKey[1]);
      assert.equal(pubKey, contactCode, "pubKey does not match contract code");
    });
    it('should register username with status contact code and address', async () => {
      const registrant = accountsArr[2];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});  
      const username = 'bob2';
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      const contactCode = '0x04dbb31252d9bddb4e4d362c7b9c80cba74732280737af97971f42ccbdc716f3f3efb1db366880e52d09b1bfd59842e833f3004088892b7d14b9ce9e957cea9a82';
      const points = utils.generateXY(contactCode);
      const label = web3Utils.sha3(username);
      const resultRegister = await UsernameRegistrar.methods.register(
        label,
        registrant,
        points.x,
        points.y
      ).send({from: registrant}); 
      assert.equal(resultRegister.events['1'].raw.topics[0], '0xce0457fe73731f824cc272376169235128c118b49d344817417c6d108d155e82', "Wrong Event");
      assert.equal(resultRegister.events['1'].raw.topics[1], registry.namehash, "Wrong Node");
      assert.equal(resultRegister.events['1'].raw.topics[2], label, "Wrong Label");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['1'].raw.data.substring(26)), UsernameRegistrar.address, "Wrong subnode owner");
      assert.equal(resultRegister.events['2'].raw.topics[0], '0x335721b01866dc23fbee8b6b2c7b1e14d6f05c28cd35a2c934239f94095602a0', "Wrong Event");
      assert.equal(resultRegister.events['2'].raw.topics[1], usernameHash, "Wrong Username");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['2'].raw.data.substring(26)), await UsernameRegistrar.methods.resolver().call(), "Wrong Resolver");
      assert.equal(resultRegister.events['3'].raw.topics[0], '0x52d7d861f09ab3d26239d492e8968629f95e9e318cf0b73bfddc441522a15fd2', "Wrong Event");
      assert.equal(resultRegister.events['3'].raw.topics[1], usernameHash, "Wrong Username");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['3'].raw.data.substring(26)), registrant, "Wrong address to resolve");
      assert.equal(resultRegister.events['4'].raw.topics[0], '0x1d6f5e03d3f63eb58751986629a5439baee5079ff04f345becb66e23eb154e46', "Wrong Event");
      assert.equal(resultRegister.events['4'].raw.topics[1], usernameHash, "Wrong Username");
      assert.equal(resultRegister.events['4'].raw.data, points.x.concat(points.y.substr(2)))
      assert.equal(resultRegister.events['5'].raw.topics[0], '0xd4735d920b0f87494915f556dd9b54c8f309026070caea5c737245152564d266', "Wrong Event");
      assert.equal(resultRegister.events['5'].raw.topics[1], usernameHash, "Wrong Username");
      assert.equal(web3Utils.toChecksumAddress("0x"+resultRegister.events['5'].raw.data.substring(26)), registrant, "Wrong registry.namehash owner");
      assert.equal(resultRegister.events.UsernameOwner.returnValues.owner, registrant, "event UsernameOwner owner mismatch");
      assert.equal(resultRegister.events.UsernameOwner.returnValues.nameHash, usernameHash, "event UsernameOwner usernameHash mismatch");   
      assert.equal(await ens.methods.owner(usernameHash).call(), registrant, "ENSRegistry owner mismatch");
      assert.equal(await ens.methods.resolver(usernameHash).call(), PublicResolver.address, "Resolver wrongly defined");
      assert.equal(await UsernameRegistrar.methods.getAccountBalance(label).call(), registry.price, "Wrong account balance");
      assert.equal(await UsernameRegistrar.methods.getAccountOwner(label).call(), registrant, "Account owner mismatch");
      assert.equal(await PublicResolver.methods.addr(usernameHash).call(), registrant, "Resolved address not set");      
      const resolverPubKey = await PublicResolver.methods.pubkey(usernameHash).call();
      const pubKey = utils.keyFromXY(resolverPubKey[0], resolverPubKey[1]);
      assert.equal(pubKey, contactCode, "pubKey does not match contract code");
    });
  });

  describe('release()', function() {
    it('should not release username due delay', async () => {
      let registrant = accountsArr[6];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});  
      let username = 'mistaker';
      await UsernameRegistrar.methods.register(
        web3Utils.sha3(username),
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      let failed;
      try{
        await UsernameRegistrar.methods.release(
          web3Utils.sha3(username),
        ).send({from: registrant});  
        failed = false;
      } catch(e){
        failed = true;
      }
      assert(failed, "Released after delay period");
    });
    it('should release username', async () => {;
      const registrant = accountsArr[6];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});  
      const username = 'frank';
      const label = web3Utils.sha3(username);
      await UsernameRegistrar.methods.register(
        label,
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      const releaseDelay = await UsernameRegistrar.methods.releaseDelay().call();
      await utils.increaseTime(releaseDelay)
      await utils.increaseTime(1000)
      const initialAccountBalance = await UsernameRegistrar.methods.getAccountBalance(label).call();
      const initialRegistrantBalance = await TestToken.methods.balanceOf(registrant).call();
      const initialRegistryBalance = await TestToken.methods.balanceOf(UsernameRegistrar.address).call();
      await utils.increaseTime(1000)
      const resultRelease = await UsernameRegistrar.methods.release(
        web3Utils.sha3(username),
        
      ).send({from: registrant});
      //TODO: check events
      assert.equal(await UsernameRegistrar.methods.getAccountBalance(label).call(), 0, "Final balance didnt zeroed");
      assert.equal(await TestToken.methods.balanceOf(registrant).call(), (+initialRegistrantBalance)+(+initialAccountBalance), "Releaser token balance didnt increase")
      assert.equal(await TestToken.methods.balanceOf(UsernameRegistrar.address).call(), (+initialRegistryBalance)-(+initialAccountBalance), "Registry token balance didnt decrease")
    });
    it('should release transfered username', async () => {
      let registrant = accountsArr[7];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});  
      let username = 'grace';
      let usernameHash = namehash.hash(username + '.' + registry.registry);
      let label = web3Utils.sha3(username);
      let newOwner = accountsArr[8];
      await UsernameRegistrar.methods.register(
        label,
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      await ens.methods.setOwner(usernameHash, newOwner).send({from: registrant});
      let releaseDelay = await UsernameRegistrar.methods.releaseDelay().call();
      await utils.increaseTime(releaseDelay)
      await utils.increaseTime(1000)
      let initialAccountBalance = await UsernameRegistrar.methods.getAccountBalance(label).call();
      let initialRegistrantBalance = await TestToken.methods.balanceOf(newOwner).call();
      let initialRegistryBalance = await TestToken.methods.balanceOf(UsernameRegistrar.address).call();
      await utils.increaseTime(1000)
      let resultRelease = await UsernameRegistrar.methods.release(
        label
      ).send({from: newOwner});
      //TODO: check events
      assert.equal(await UsernameRegistrar.methods.getAccountBalance(label).call(), 0, "Final balance didnt zeroed");
      assert.equal(await TestToken.methods.balanceOf(newOwner).call(), (+initialRegistrantBalance)+(+initialAccountBalance), "New owner token balance didnt increase")
      assert.equal(await TestToken.methods.balanceOf(UsernameRegistrar.address).call(), (+initialRegistryBalance)-(+initialAccountBalance), "Registry token balance didnt decrease")
    });
    it('should release moved username account balance by owner', async () => {
      const registrant = accountsArr[5];
      UsernameRegistrar
      UpdatedUsernameRegistrar
      await TestToken.methods.mint(dummyRegistry.price).send({from: registrant});
      await DummyUsernameRegistrar.methods.activate(dummyRegistry.price).send({from: accountsArr[0]});
      await TestToken.methods.approve(DummyUsernameRegistrar.address, dummyRegistry.price).send({from: registrant});  
      
      const username = 'hardhead';
      const label = web3Utils.sha3(username);
      await DummyUsernameRegistrar.methods.register(
        label,
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      let initialAccountBalance = await DummyUsernameRegistrar.methods.getAccountBalance(label).call();
      const initialRegistrantBalance = await TestToken.methods.balanceOf(registrant).call();
      const initialRegistryBalance = await TestToken.methods.balanceOf(DummyUsernameRegistrar.address).call();
      await DummyUsernameRegistrar.methods.moveRegistry(UpdatedDummyUsernameRegistrar.address).send();
      const resultRelease = await DummyUsernameRegistrar.methods.release(
        label
      ).send({from: registrant});
      //TODO: verify events
      assert.equal(await TestToken.methods.balanceOf(registrant).call(), (+initialRegistrantBalance)+(+initialAccountBalance), "New owner token balance didnt increase")
      assert.equal(await TestToken.methods.balanceOf(DummyUsernameRegistrar.address).call(), (+initialRegistryBalance)-(+initialAccountBalance), "Registry token balance didnt decrease")
    });
  });
  
  describe('updateAccountOwner()', function() {
    it('should update username account owner', async () => {
      let username = 'heidi';
      let label = web3Utils.sha3(username);
      let registrant = accountsArr[8];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});
      let newOwner = accountsArr[9];
      let usernameHash = namehash.hash(username + '.' + registry.registry);
      
      await UsernameRegistrar.methods.register(
        label,
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      await ens.methods.setOwner(usernameHash, newOwner).send({from: registrant});
      let resultUpdateOwner = await UsernameRegistrar.methods.updateAccountOwner(
        label
      ).send({from: newOwner});
      //TODO: check events
      assert.equal(await UsernameRegistrar.methods.getAccountOwner(label).call(), newOwner, "Backup owner not updated");
    });
  });
  
  describe('slashInvalidUsername()', function() {
    it('should slash invalid username', async () => {
      let username = 'alicé';
      let label = web3Utils.sha3(username);
      let usernameHash = namehash.hash(username + '.' + registry.registry);
      let registrant = accountsArr[1];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});
      await UsernameRegistrar.methods.register(
        web3Utils.sha3(username),

        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      assert.equal(await ens.methods.owner(usernameHash).call(), registrant);
      assert.notEqual(await UsernameRegistrar.methods.getCreationTime(label).call(), 0);
      await UsernameRegistrar.methods.slashInvalidUsername(web3Utils.toHex(username), 4).send()
      //TODO: check events
      assert.equal(await UsernameRegistrar.methods.getCreationTime(label).call(), 0);
      assert.equal(await ens.methods.owner(usernameHash).call(), utils.zeroAddress);
    });
    it('should not slash valid username', async () => {
      const username = 'legituser';
      const registrant = accountsArr[1];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});
      await UsernameRegistrar.methods.register(
        web3Utils.sha3(username),
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});    
      let failed;
      try{
        await UsernameRegistrar.methods.slashInvalidUsername(web3Utils.toHex(username), 4).send()
        failed = false;
      } catch(e){
        failed = true;
      }
      assert(failed, "Was slashed anyway");
    });
  });

  describe('slashReservedUsername()', function() {
    it('should not slash not reserved name username', async () => {
      const username = 'somedummyname123';
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      const registrant = accountsArr[1];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});
      await UsernameRegistrar.methods.register(
        web3Utils.sha3(username),
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      assert.equal(await ens.methods.owner(usernameHash).call(), registrant);
      let failed;
      try{
        await UsernameRegistrar.methods.slashReservedUsername(web3Utils.toHex(username), merkleTree.getHexProof(reservedNames[0])).send()
        failed = false;
      } catch(e){
        failed = true;
      }
      assert(failed, "Was slashed anyway");
    });
    it('should not slash reserved name username with wrong proof ', async () => {
      const username = reservedNames[5];
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      const registrant = accountsArr[1];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});
      await UsernameRegistrar.methods.register(
        web3Utils.sha3(username),
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      assert.equal(await ens.methods.owner(usernameHash).call(), registrant);
      let failed;
      try{
        await UsernameRegistrar.methods.slashReservedUsername(web3Utils.toHex(username), merkleTree.getHexProof(reservedNames[1])).send()
        failed = false;
      } catch(e){
        failed = true;
      }
      assert(failed, "Was slashed anyway");
    });
    it('should slash reserved name username', async () => {
      const username = reservedNames[7];
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      const registrant = accountsArr[1];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});
      await UsernameRegistrar.methods.register(
        web3Utils.sha3(username),
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      assert.equal(await ens.methods.owner(usernameHash).call(), registrant);
      result = await UsernameRegistrar.methods.slashReservedUsername(web3Utils.toHex(username), merkleTree.getHexProof(username)).send()  
      //TODO: check events
      assert.equal(await ens.methods.owner(usernameHash).call(), utils.zeroAddress);
    });
  });

  describe('slashSmallUsername()', function() {
    it('should not slash big username', async() =>{
      let username = '1234567890';
      let registrant = accountsArr[1];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});
      await UsernameRegistrar.methods.register(
        web3Utils.sha3(username),
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      let failed;
      try{
        await UsernameRegistrar.methods.slashSmallUsername(web3Utils.toHex(username)).send()    
        failed = false;
      } catch(e){
        failed = true;
      }
      assert(failed, "Was slashed anyway");
    })
    it('should slash small username', async () => {
      let username = 'a';
      let usernameHash = namehash.hash(username + '.' + registry.registry);
      let registrant = accountsArr[1];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});
      await UsernameRegistrar.methods.register(
        web3Utils.sha3(username),

        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});  
      assert.equal(await ens.methods.owner(usernameHash).call(), registrant);
      result = await UsernameRegistrar.methods.slashSmallUsername(web3Utils.toHex(username)).send()    
      assert.equal(await ens.methods.owner(usernameHash).call(), utils.zeroAddress);
    });
  });
  
  describe('slashAddressLikeUsername()', function() {
    it('should slash username that starts with 0x and is 12 of lenght or bigger', async () => {
      let username = "0xc6b95bd26123";
      let userlabelHash = "0xe311c0592b075c30277c679f0daea74ee1727547efa522fd28d20a8f2c3e435b"; //sha3("0xc6b95bd26123")
      let usernameHash = "0xb707907c2749895522150dd9e6dec4f71f1662ce873f8bf0b8682fa052ff495e"; //namehash("0xc6b95bd26123.stateofus.eth")
      let registrant = accountsArr[1];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});
      await UsernameRegistrar.methods.register(
        userlabelHash,
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      assert.equal(await ens.methods.owner(usernameHash).call(), registrant);
      result = await UsernameRegistrar.methods.slashAddressLikeUsername(web3Utils.toHex(username)).send()    
      assert.equal(await ens.methods.owner(usernameHash).call(), utils.zeroAddress);
    });
    it('should not slash username that starts with 0x but is smaller then 12', async () => {
      let username = "0xc6b95bd26";
      let userlabelHash = "0x59bf8d16c517a40a5dacc3471abd002f3bc0850a13e930e4bee49070a58517e8"; //sha3("0xc6b95bd26")
      let registrant = accountsArr[1];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});
      await UsernameRegistrar.methods.register(
        userlabelHash,
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      let failed;
      try{
        result = await UsernameRegistrar.methods.slashAddressLikeUsername(username).send()    
        failed = false;
      } catch(e){
        failed = true;
      }
      assert(failed, "Was slashed anyway");
    });
    it('should not slash username that dont starts 0x and is bigger than 12', async () => {
      const username = "0a002322c6b95bd26";
      const userlabelHash = "0xe4769e5c31ff61ac50dce20559a4411a4ca45d94c733cbeda7ab9f28ed75cef1"; //sha3("0a002322c6b95bd26")
      const registrant = accountsArr[1];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});
      await UsernameRegistrar.methods.register(
        userlabelHash,
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      let failed;
      try{
        await UsernameRegistrar.methods.slashAddressLikeUsername(username).send()    
        failed = false;
      } catch(e){
        failed = true;
      }
      assert(failed, "Was slashed anyway");     
    });
  });
  describe('slashUsername()', function() {
    it('should slash a username and get funds from registrant', async () => {
      const username = 'b';
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      const registrant = accountsArr[1];
      const slasher = accountsArr[2];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});
      await UsernameRegistrar.methods.register(
        web3Utils.sha3(username),
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
      ).send({from: registrant});
      assert.equal(await ens.methods.owner(usernameHash).call(), registrant);
      const initialSlasherBalance = await TestToken.methods.balanceOf(slasher).call();
      await UsernameRegistrar.methods.slashSmallUsername(web3Utils.toHex(username)).send({from: slasher})
      //TODO: check events
      assert.equal(await TestToken.methods.balanceOf(slasher).call(), (+initialSlasherBalance)+(+registry.price));    
      assert.equal(await ens.methods.owner(usernameHash).call(), utils.zeroAddress);
    });
  });
  
  describe('moveRegistry()', function() {
    it('should move registry to new registry and migrate', async () => {
      const result = await UsernameRegistrar.methods.moveRegistry(UpdatedUsernameRegistrar.address).send();
      //TODO: check events
      assert.equal(await ens.methods.owner(registry.namehash).call(), UpdatedUsernameRegistrar.address, "registry ownership not moved correctly")
      assert.equal(await UpdatedUsernameRegistrar.methods.getPrice().call(), registry.price, "updated registry didnt migrated price")
    });
  });

  describe('moveAccount()', function() {
    it('should move username to new registry by account owner', async () => {
      const registrant = accountsArr[5];
      const username = 'erin';
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      const label = web3Utils.sha3(username);
      
      const accountBalance = await UsernameRegistrar.methods.getAccountBalance(label).call()
      assert.notEqual(accountBalance, 0);
      const initialRegistryBalance = await TestToken.methods.balanceOf(UsernameRegistrar.address).call();
      const initialUpdatedRegistryBalance = await TestToken.methods.balanceOf(UpdatedUsernameRegistrar.address).call();
      const creationTime = await UsernameRegistrar.methods.getCreationTime(label).call();
      assert.notEqual(creationTime, 0);
      assert.equal(await UpdatedUsernameRegistrar.methods.getCreationTime(label).call(), 0);
      const result = await UsernameRegistrar.methods.moveAccount(label).send({from: registrant});
      assert.equal(await UsernameRegistrar.methods.getCreationTime(label).call(), 0);
      assert.equal(await UpdatedUsernameRegistrar.methods.getCreationTime(label).call(), creationTime);
      assert.equal(await TestToken.methods.balanceOf(UsernameRegistrar.address).call(), (+initialRegistryBalance)-(+accountBalance))
      assert.equal(await TestToken.methods.balanceOf(UpdatedUsernameRegistrar.address).call(), (+initialUpdatedRegistryBalance)+(+accountBalance))
    });
  });

});
