const utils = require('../utils/testUtils.js');
const web3Utils = require('web3-utils');
const namehash = require('eth-ens-namehash');
const TestToken = require('Embark/contracts/TestToken');
const ENSRegistry = require('Embark/contracts/ENSRegistry');
const PublicResolver = require('Embark/contracts/PublicResolver');
const ENSSubdomainRegistry = require('Embark/contracts/ENSSubdomainRegistry');
const { MerkleTree } = require('../utils/merkleTree.js');

/**
 * 
 * Unicode decimal ranges unallowed:
 * 0-47 (C0 + ASCII Punctuation & Symbols)
 * 58-96 (ASCII Punctuation & Symbols + Latin Alphabet: Uppercase)
 * 123-1023 (ASCII Punctuation & Symbols + C1 + Latin-1 Punctuation & Symbols, (...))
 * 1023-115792089237316195423570985008687907853269984665640564039457584007913129639935 (Everything else)
 * Unicode decimal ranges allowed:
 * 48-57 (ASCII Digits; 0-9)
 * 97-122 (Latin Alphabet: Lowercase; a-z)
 */


const unallowedRanges = [
  web3Utils.soliditySha3(0,47),
  web3Utils.soliditySha3(58,96),
  web3Utils.soliditySha3(123,1023),
  web3Utils.soliditySha3(1023,9999999999)
];
const merkleTree = new MerkleTree(unallowedRanges);
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
      merkleRoot, 
      "0x0"
    ],
    "onDeploy": [
      "ENSRegistry.methods.setSubnodeOwner('0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae', '0xbd99f8d5e7f81d2d7c1da34b67a2bb3a94dd8c9b0ab40ddc077621b98405983b', ENSSubdomainRegistry.address).send()",
      "ENSRegistry.methods.setSubnodeOwner('0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae', '0x7b4768a525e733422bf968587a91b4036e5176d36f44a9fb5b29d0bca03ab3a3', ENSSubdomainRegistry.address).send()"
    ]
  },
  "UpdatedENSSubdomainRegistry": {
    "instanceOf" : "ENSSubdomainRegistry",
    "args": [
      "$TestToken",
      "$ENSRegistry",
      "$PublicResolver",
      merkleRoot,
      "$ENSSubdomainRegistry"
    ]
  }

};

config({ contracts: contractsConfig });

contract('ENSSubdomainRegistry', function () {
  //this.timeout(0);
  let domains = {
    free : {
      name: 'freedomain.eth',
      price: 0,
      namehash: namehash.hash('freedomain.eth')
    },
    paid : {
      name: 'stateofus.eth',
      price: 100000000,
      namehash: namehash.hash('stateofus.eth')
    }
  }
  let ens;
  let accountsArr;

  before(function(done) {
    web3.eth.getAccounts().then(async (accounts) => {
      ens = ENSRegistry;
      accountsArr = accounts;
      await utils.increaseTime(1 * utils.timeUnits.days) //time cannot start zero
      done();
    })
  });

  it('should add free domain', async () => {
    let result = await ENSSubdomainRegistry.methods.setDomainPrice(domains.free.namehash, 0).send({from: accountsArr[0]});
    assert.equal(result.events.DomainPrice.returnValues.price, domains.free.price);
    assert.equal(result.events.DomainPrice.returnValues.namehash, domains.free.namehash);
    result = await ENSSubdomainRegistry.methods.getPrice(domains.free.namehash).call()
    assert.equal(result, 0);
    result = await ENSSubdomainRegistry.methods.domains(domains.free.namehash).call()

    assert(result.state, 1)
    assert(result.price, domains.free.price)
  });

  it('should add paid domain', async () => {
    let initialPrice = 100
    let result = await ENSSubdomainRegistry.methods.setDomainPrice(domains.paid.namehash, initialPrice).send({from: accountsArr[0]});
    assert.equal(result.events.DomainPrice.returnValues.price, initialPrice);
    assert.equal(result.events.DomainPrice.returnValues.namehash, domains.paid.namehash);
    result = await ENSSubdomainRegistry.methods.getPrice(domains.paid.namehash).call()
    assert.equal(result, initialPrice);
    result = await ENSSubdomainRegistry.methods.domains(domains.free.namehash).call()
    assert(result.state, 1)
    assert(result.price, domains.paid.price)
  });

  it('should change paid domain price', async () => {
    let newPrice = domains.paid.price;
    let result = await ENSSubdomainRegistry.methods.updateDomainPrice(domains.paid.namehash, newPrice).send({from: accountsArr[0]});
    assert.equal(result.events.DomainPrice.returnValues.price, newPrice, "Wrong price at event");
    assert.equal(result.events.DomainPrice.returnValues.namehash, domains.paid.namehash, "Wrong namehash at event");
    result = await ENSSubdomainRegistry.methods.getPrice(domains.paid.namehash).call()
    assert.equal(result, newPrice, "Wrong return value at getPrice");
    result = await ENSSubdomainRegistry.methods.domains(domains.paid.namehash).call()

    assert(result.state, 1)
    assert(result.price, newPrice)
  });


  it('should register free subdomain', async () => {
    let subdomain = 'alice';
    let usernameHash = namehash.hash(subdomain + '.' + domains.free.name);
    let registrant = accountsArr[1];
    let result = await ENSSubdomainRegistry.methods.register(
      web3Utils.sha3(subdomain),
      domains.free.namehash,
      utils.zeroAddress,
      utils.zeroBytes32,
      utils.zeroBytes32
    ).send({from: registrant});

    //TODO: check events

    result = await ens.methods.owner(usernameHash).call()
    assert.equal(result, registrant);
    result = await ens.methods.resolver(usernameHash).call()
    assert.equal(result, utils.zeroAddress);
    let accountBalance = await ENSSubdomainRegistry.methods.getAccountBalance(usernameHash).call();
    assert(accountBalance, 0, "Registry subdomain account balance wrong");
    result = await ENSSubdomainRegistry.methods.getFundsOwner(usernameHash).call();
    assert(result, registrant, "Backup owner not set");
  });

  it('should register free address only resolver-defined subdomain', async () => {
    let registrant = accountsArr[2];
    let subdomain = 'bob';
    let usernameHash = namehash.hash(subdomain + '.' + domains.free.name);
    let result = await ENSSubdomainRegistry.methods.register(
      web3Utils.sha3(subdomain),
      domains.free.namehash,
      registrant,
      utils.zeroBytes32,
      utils.zeroBytes32
    ).send({from: registrant});

    //TODO: check events

    result = await ens.methods.owner(usernameHash).call()
    assert.equal(result, registrant, "Owner not set");
    result = await ens.methods.resolver(usernameHash).call()
    assert.equal(result, PublicResolver.address, "PublicResolver not set");
    result = await PublicResolver.methods.addr(usernameHash).call()
    assert.equal(result, registrant, "Resolved address not set");
    result = await PublicResolver.methods.pubkey(usernameHash).call()
    assert.equal(result[0], utils.zeroBytes32, "Unexpected resolved pubkey[0]");
    assert.equal(result[1], utils.zeroBytes32, "Unexpected resolved pubkey[1]");
  });

  it('should register free status contact code only resolver-defined subdomain', async () => {
    let registrant = accountsArr[2];
    let subdomain = 'bob2';
    let usernameHash = namehash.hash(subdomain + '.' + domains.free.name);
    let contactCode = '0x04dbb31252d9bddb4e4d362c7b9c80cba74732280737af97971f42ccbdc716f3f3efb1db366880e52d09b1bfd59842e833f3004088892b7d14b9ce9e957cea9a82';
    let points = utils.generateXY(contactCode);
    let result = await ENSSubdomainRegistry.methods.register(
      web3Utils.sha3(subdomain),
      domains.free.namehash,
      registrant,
      points.x,
      points.y
    ).send({from: registrant});

    result = await ens.methods.owner(usernameHash).call()
    assert.equal(result, registrant, "Owner not set");
    result = await ens.methods.resolver(usernameHash).call()
    assert.equal(result, PublicResolver.address, "PublicResolver not set");
    result = await PublicResolver.methods.pubkey(usernameHash).call();
    let pubKey = utils.keyFromXY(result[0], result[1]);
    assert.equal(pubKey, contactCode, "pubKey does not match contract code");
  });



  it('should register free pubkey only resolver-defined subdomain', async () => {
    let subdomain = 'carlos';
    let registrant = accountsArr[3];
    let usernameHash = namehash.hash(subdomain + '.' + domains.free.name);
    let pubkey = [web3Utils.sha3("0"), web3Utils.sha3("1")];
    let result = await ENSSubdomainRegistry.methods.register(
      web3Utils.sha3(subdomain),
      domains.free.namehash,
      utils.zeroAddress,
      pubkey[0],
      pubkey[1]
    ).send({from: registrant});

    //TODO: check events

    result = await ens.methods.owner(usernameHash).call()
    assert.equal(result, registrant, "Owner not set");
    result = await ens.methods.resolver(usernameHash).call()
    assert.equal(result, PublicResolver.address, "PublicResolver not set");
    result = await PublicResolver.methods.addr(usernameHash).call()
    assert.equal(result, utils.zeroAddress, "Resolved address unexpectedlly set");
    result = await PublicResolver.methods.pubkey(usernameHash).call()
    assert.equal(result[0], pubkey[0], "Resolved pubkey[0] not set");
    assert.equal(result[1], pubkey[1], "Resolved pubkey[1] not set");
  });


  it('should register free full resolver-defined subdomain', async () => {
    let registrant = accountsArr[4];
    let subdomain = 'david';
    let usernameHash = namehash.hash(subdomain + '.' + domains.free.name);
    let pubkey = [web3Utils.sha3("2"), web3Utils.sha3("3")];

    let result = await ENSSubdomainRegistry.methods.register(
      web3Utils.sha3(subdomain),
      domains.free.namehash,
      registrant,
      pubkey[0],
      pubkey[1]
    ).send({from: registrant});

    //TODO: check events

    result = await ens.methods.owner(usernameHash).call()
    assert.equal(result, registrant, "Owner not set");
    result = await ens.methods.resolver(usernameHash).call()
    assert.equal(result, PublicResolver.address, "PublicResolver not set");
    result = await PublicResolver.methods.addr(usernameHash).call()
    assert.equal(result, registrant, "Resolved address not set");
    result = await PublicResolver.methods.pubkey(usernameHash).call()
    assert.equal(result[0], pubkey[0], "Resolved pubkey[0] not set");
    assert.equal(result[1], pubkey[1], "Resolved pubkey[1] not set");
  });

  it('should release free subdomain', async () => {
    let registrant = accountsArr[6];
    let subdomain = 'frank';
    let usernameHash = namehash.hash(subdomain + '.' + domains.free.name);

    await ENSSubdomainRegistry.methods.register(
      web3Utils.sha3(subdomain),
      domains.free.namehash,
      utils.zeroAddress,
      utils.zeroBytes32,
      utils.zeroBytes32
    ).send({from: registrant});
    let releaseDelay = await ENSSubdomainRegistry.methods.releaseDelay().call();
    await utils.increaseTime(releaseDelay)

    let initialRegistrantBalance = await TestToken.methods.balanceOf(registrant).call();
    let initialRegistryBalance = await TestToken.methods.balanceOf(ENSSubdomainRegistry.address).call();

    let result = await ENSSubdomainRegistry.methods.release(
      web3Utils.sha3(subdomain),
      domains.free.namehash
    ).send({from: registrant});

    //TODO: check events

    result = await ens.methods.owner(usernameHash).call()
    assert.equal(result, utils.zeroAddress, "Not released name ownship");
    let finalRegistrantBalance = await TestToken.methods.balanceOf(registrant).call();
    assert(finalRegistrantBalance, initialRegistrantBalance, "Registrant token balance unexpectectly changed")
    let finalRegistryBalance = await TestToken.methods.balanceOf(ENSSubdomainRegistry.address).call();
    assert(finalRegistryBalance, initialRegistryBalance, "Registry token balance unexpectectly changed")

  });

  it('should register empty subdomain with token cost', async () => {
    let registrant = accountsArr[5];
    let subdomain = 'erin';
    let usernameHash = namehash.hash(subdomain + '.' + domains.paid.name);
    let domainPrice = await ENSSubdomainRegistry.methods.getPrice(domains.paid.namehash).call()
    await TestToken.methods.mint(domainPrice).send({from: registrant});

    let initialRegistrantBalance = await TestToken.methods.balanceOf(registrant).call();
    let initialRegistryBalance = await TestToken.methods.balanceOf(ENSSubdomainRegistry.address).call();

    await TestToken.methods.approve(ENSSubdomainRegistry.address, domainPrice).send({from: registrant});

    let result = await ENSSubdomainRegistry.methods.register(
      web3Utils.sha3(subdomain),
      domains.paid.namehash,
      utils.zeroAddress,
      utils.zeroBytes32,
      utils.zeroBytes32
    ).send({from: registrant});

    //TODO: check events

    result = await ens.methods.owner(namehash.hash(subdomain + '.' + domains.paid.name)).call()
    assert.equal(result, registrant);
    result = await ens.methods.resolver(namehash.hash(subdomain + '.' + domains.paid.name)).call()
    assert.equal(result, utils.zeroAddress);

    let accountBalance = await ENSSubdomainRegistry.methods.getAccountBalance(usernameHash).call();
    assert(accountBalance, domainPrice, "Registry subdomain account balance wrong");
    let finalRegistrantBalance = await TestToken.methods.balanceOf(registrant).call();
    assert(finalRegistrantBalance, +initialRegistrantBalance-domainPrice, "User final balance wrong")
    let finalRegistryBalance = await TestToken.methods.balanceOf(ENSSubdomainRegistry.address).call();
    assert(finalRegistryBalance, +finalRegistryBalance+domainPrice, "Registry final balance wrong")

  });


  it('should release subdomain with cost', async () => {;
                                                        let registrant = accountsArr[6];
                                                        let subdomain = 'frank';
                                                        let usernameHash = namehash.hash(subdomain + '.' + domains.paid.name);
                                                        let labelHash = web3Utils.sha3(subdomain);
                                                        let domainPrice = await ENSSubdomainRegistry.methods.getPrice(domains.paid.namehash).call()
                                                        await TestToken.methods.mint(domainPrice).send({from: registrant});
                                                        await TestToken.methods.approve(ENSSubdomainRegistry.address, domainPrice).send({from: registrant});
                                                        let result = await ENSSubdomainRegistry.methods.register(
                                                          labelHash,
                                                          domains.paid.namehash,
                                                          utils.zeroAddress,
                                                          utils.zeroBytes32,
                                                          utils.zeroBytes32
                                                        ).send({from: registrant});

                                                        //TODO: check events

                                                        let releaseDelay = await ENSSubdomainRegistry.methods.releaseDelay().call();
                                                        utils.increaseTime(releaseDelay)

                                                        let initialAccountBalance = await ENSSubdomainRegistry.methods.getAccountBalance(usernameHash).call();
                                                        let initialRegistrantBalance = await TestToken.methods.balanceOf(registrant).call();
                                                        let initialRegistryBalance = await TestToken.methods.balanceOf(ENSSubdomainRegistry.address).call();

                                                        await ENSSubdomainRegistry.methods.release(
                                                          web3Utils.sha3(subdomain),
                                                          domains.paid.namehash
                                                        ).send({from: registrant});
                                                        let finalAccountBalance = await ENSSubdomainRegistry.methods.getAccountBalance(usernameHash).call();
                                                        assert(finalAccountBalance, 0, "Final balance didnt zeroed");
                                                        let finalRegistrantBalance = await TestToken.methods.balanceOf(registrant).call();
                                                        assert(finalRegistrantBalance, +initialRegistrantBalance+initialAccountBalance, "Releaser token balance didnt increase")
                                                        let finalRegistryBalance = await TestToken.methods.balanceOf(ENSSubdomainRegistry.address).call();
                                                        assert(finalRegistryBalance, +initialRegistryBalance-initialAccountBalance, "Registry token balance didnt decrease")

                                                       });

  it('should release transfered subdomain with cost', async () => {
    let registrant = accountsArr[7];
    let subdomain = 'grace';
    let usernameHash = namehash.hash(subdomain + '.' + domains.paid.name);
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
    await ens.methods.setOwner(usernameHash, newOwner).send({from: registrant});

    let releaseDelay = await ENSSubdomainRegistry.methods.releaseDelay().call();
    await utils.increaseTime(releaseDelay)

    let initialAccountBalance = await ENSSubdomainRegistry.methods.getAccountBalance(usernameHash).call();
    let initialRegistrantBalance = await TestToken.methods.balanceOf(newOwner).call();
    let initialRegistryBalance = await TestToken.methods.balanceOf(ENSSubdomainRegistry.address).call();

    let result = await ENSSubdomainRegistry.methods.release(
      web3Utils.sha3(subdomain),
      domains.paid.namehash
    ).send({from: newOwner});

    //TODO: check events

    let finalAccountBalance = await ENSSubdomainRegistry.methods.getAccountBalance(usernameHash).call();
    assert(finalAccountBalance, 0, "Final balance didnt zeroed");
    let finalRegistrantBalance = await TestToken.methods.balanceOf(newOwner).call();
    assert(finalRegistrantBalance, +initialRegistrantBalance+initialAccountBalance, "New owner token balance didnt increase")
    let finalRegistryBalance = await TestToken.methods.balanceOf(ENSSubdomainRegistry.address).call();
    assert(finalRegistryBalance, +initialRegistryBalance-initialAccountBalance, "Registry token balance didnt decrease")

  });

  it('should update subdomain funds owner', async () => {
    let subdomain = 'heidi';
    let labelHash = web3Utils.sha3(subdomain);
    let registrant = accountsArr[8];
    let newOwner = accountsArr[9];
    let usernameHash = namehash.hash(subdomain + '.' + domains.paid.name);
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
    await ens.methods.setOwner(usernameHash, newOwner).send({from: registrant});

    let result = await ENSSubdomainRegistry.methods.updateFundsOwner(
      labelHash,
      domains.paid.namehash
    ).send({from: newOwner});

    //TODO: check events

    result = await ENSSubdomainRegistry.methods.getFundsOwner(usernameHash).call();
    assert(result, newOwner, "Backup owner not updated");
  });


  it('should move domain to new registry and migrate', async () => {
    let price = await ENSSubdomainRegistry.methods.getPrice(domains.paid.namehash).call()
    let result = await ENSSubdomainRegistry.methods.moveDomain(UpdatedENSSubdomainRegistry.address, domains.paid.namehash).send();

    //TODO: check events

    result = await ens.methods.owner(domains.paid.namehash).call()
    assert(result, UpdatedENSSubdomainRegistry.address, "domain ownership not moved correctly")
    result = await UpdatedENSSubdomainRegistry.methods.getPrice(domains.paid.namehash).call()
    assert(result, price, "updated registry didnt migrated price")
  });

  xit('should release moved free subdomain account balance by funds owner', async () => {

  });

  xit('should migrate free subdomain to new registry by funds owner', async () => {

  });

  xit('should release moved paid subdomain account balance by funds owner', async () => {

  });

  xit('should migrate paid subdomain to new registry by funds owner', async () => {

  });


  
  it('should slash free subdomain', async () => {
    let subdomain = 'alicé';
    let usernameHash = namehash.hash(subdomain + '.' + domains.free.name);
    let registrant = accountsArr[1];
    let result = await ENSSubdomainRegistry.methods.register(
      web3Utils.sha3(subdomain),
      domains.free.namehash,
      utils.zeroAddress,
      utils.zeroBytes32,
      utils.zeroBytes32
    ).send({from: registrant});

    //TODO: check events
    
    
    


    result = await ens.methods.owner(usernameHash).call()
    
    assert.equal(result, registrant);
    
    let accountCreationTime = await ENSSubdomainRegistry.methods.getCreationTime(usernameHash).call();
    assert(accountCreationTime > 0);
    

    const proof = merkleTree.getHexProof(unallowedRanges[2]);

    result = await ENSSubdomainRegistry.methods.slashSubdomain(web3Utils.toHex(subdomain), domains.free.namehash, 4, 123, 1023, proof).send()
  
    accountCreationTime = await ENSSubdomainRegistry.methods.getCreationTime(usernameHash).call();
    assert(accountCreationTime == 0);

    result = await ens.methods.owner(usernameHash).call()
    
    assert.equal(result, utils.zeroAddress);
  });

});
