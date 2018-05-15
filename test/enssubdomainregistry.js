const utils = require('../utils/testUtils.js');
const web3Utils = require('web3-utils');
const namehash = require('eth-ens-namehash');

contract('ENSSubdomainRegistry', function () {

    let ens;
    let accountsArr;

    before(function(done) {
        this.timeout(0);
        var contractsConfig = {
            "TestToken": {
            
            },
            "ENSRegistry": {
            
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
                    "0x0"
                ]
            }
        };
        EmbarkSpec.deployAll(contractsConfig, async (accounts) => { 
          ens = ENSRegistry;
          accountsArr = accounts; 
          await ens.methods.setSubnodeOwner(utils.zeroBytes32, web3Utils.sha3('eth'), accountsArr[0]).send({from: accountsArr[0]});
          await ens.methods.setSubnodeOwner(namehash.hash('eth'), web3Utils.sha3('stateofus'), ENSSubdomainRegistry.address).send({from: accountsArr[0]});
          await ens.methods.setSubnodeOwner(namehash.hash('eth'), web3Utils.sha3('stateofus'), ENSSubdomainRegistry.address).send({from: accountsArr[0]});
          done()
        });
      });

      it('should add domain with price zero', async () => {
        let result = await ENSSubdomainRegistry.methods.addDomain(namehash.hash('stateofus.eth'), 0).send({from: accountsArr[0]});       
        assert.equal(result.events.DomainPrice.returnValues.price, 0);
        assert.equal(result.events.DomainPrice.returnValues.namehash, namehash.hash('stateofus.eth'));
        result = await ENSSubdomainRegistry.methods.getPrice(namehash.hash('stateofus.eth')).call()
        assert.equal(result, 0);
    });

    
    it('should register empty subdomain with zero cost', async () => {
        let domain = 'stateofus.eth';
        let subdomain = 'alice';
        let usernameHash = namehash.hash(subdomain + '.' + domain);
        let registrant = accountsArr[1];
        let result = await ENSSubdomainRegistry.methods.register(
            web3Utils.sha3(subdomain), 
            namehash.hash(domain),
            utils.zeroAddress,
            utils.zeroBytes32,
            utils.zeroBytes32
        ).send({from: registrant});       
       
        result = await ens.methods.owner(usernameHash).call()
        assert.equal(result, registrant);
        result = await ens.methods.resolver(usernameHash).call()
        assert.equal(result, utils.zeroAddress);
        let accountBalance = await ENSSubdomainRegistry.methods.getAccountBalance(usernameHash).call();
        assert(accountBalance, 0, "Registry subdomain account balance wrong");
        result = await ENSSubdomainRegistry.methods.getBackupOwner(usernameHash).call();
        assert(result, registrant, "Backup owner not set");
    });

    it('should register address only resolver-defined subdomain', async () => {
        let domain = 'stateofus.eth';
        let subdomain = 'bob';
        let usernameHash = namehash.hash(subdomain + '.' + domain);
        let registrant = accountsArr[2];
        let result = await ENSSubdomainRegistry.methods.register(
            web3Utils.sha3(subdomain), 
            namehash.hash(domain),
            registrant,
            utils.zeroBytes32,
            utils.zeroBytes32
        ).send({from: registrant});       
        
        
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

    it('should register pubkey only resolver-defined subdomain', async () => {
        let domain = 'stateofus.eth';
        let subdomain = 'carlos';
        let registrant = accountsArr[3];
        let pubkey = [web3Utils.sha3("0"), web3Utils.sha3("1")];
        let result = await ENSSubdomainRegistry.methods.register(
            web3Utils.sha3(subdomain), 
            namehash.hash(domain),
            utils.zeroAddress,
            pubkey[0],
            pubkey[1]
        ).send({from: registrant});       
        
        let usernameHash = namehash.hash(subdomain + '.' + domain);
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

    
    it('should register full resolver-defined subdomain', async () => {
        let domain = 'stateofus.eth';
        let subdomain = 'david';
        let usernameHash = namehash.hash(subdomain + '.' + domain);
        let registrant = accountsArr[4];
        let pubkey = [web3Utils.sha3("2"), web3Utils.sha3("3")];
        let result = await ENSSubdomainRegistry.methods.register(
            web3Utils.sha3(subdomain), 
            namehash.hash(domain),
            registrant,
            pubkey[0],
            pubkey[1]
        ).send({from: registrant});       
        
        
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

    xit('should release subdomain registered with zero cost', async () => {
        let domain = 'stateofus.eth';
        let subdomain = 'frank';
        let registrant = accountsArr[6];

        await ENSSubdomainRegistry.methods.register(
            web3Utils.sha3(subdomain), 
            namehash.hash(domain),
            utils.zeroAddress,
            utils.zeroBytes32,
            utils.zeroBytes32
        ).send({from: registrant});  
        
        let initialRegistrantBalance = await TestToken.methods.balanceOf(registrant).call();
        let initialRegistryBalance = await TestToken.methods.balanceOf(ENSSubdomainRegistry.address).call();
        //TODO: Forward time 1 year
        await ENSSubdomainRegistry.methods.release(
            web3Utils.sha3(subdomain), 
            domainHash
        ).send({from: registrant});
        result = await ens.methods.owner(usernameHash).call()
        assert.equal(result, utils.zeroAddress, "Not released name ownship");
        let finalRegistrantBalance = await TestToken.methods.balanceOf(registrant).call();
        assert(finalRegistrantBalance, initialRegistrantBalance, "Registrant token balance unexpectectly changed")
        let finalRegistryBalance = await TestToken.methods.balanceOf(ENSSubdomainRegistry.address).call();
        assert(finalRegistryBalance, initialRegistryBalance, "Registry token balance unexpectectly changed")
        
    });


    it('should change domain price', async () => {
        let newPrice = 100000000000000;
        let domainHash = namehash.hash('stateofus.eth');
        let result = await ENSSubdomainRegistry.methods.setDomainPrice(domainHash, newPrice).send({from: accountsArr[0]});       
        assert.equal(result.events.DomainPrice.returnValues.price, newPrice, "Wrong price at event");
        assert.equal(result.events.DomainPrice.returnValues.namehash, domainHash, "Wrong namehash at event");
        result = await ENSSubdomainRegistry.methods.getPrice(domainHash).call()
        assert.equal(result, newPrice, "Wrong return value at getPrice");
    });

    
    it('should register empty subdomain with token cost', async () => {
        let domain = 'stateofus.eth';
        let subdomain = 'erin';
        let registrant = accountsArr[5];
        let domainHash = namehash.hash('stateofus.eth');
        let usernameHash = namehash.hash(subdomain + '.' + domain);
        let domainPrice = await ENSSubdomainRegistry.methods.getPrice(domainHash).call()
        await TestToken.methods.mint(domainPrice).send({from: registrant});

        let initialRegistrantBalance = await TestToken.methods.balanceOf(registrant).call();
        let initialRegistryBalance = await TestToken.methods.balanceOf(ENSSubdomainRegistry.address).call();
        
        await TestToken.methods.approve(ENSSubdomainRegistry.address, domainPrice).send({from: registrant});

        let result = await ENSSubdomainRegistry.methods.register(
            web3Utils.sha3(subdomain), 
            domainHash,
            utils.zeroAddress,
            utils.zeroBytes32,
            utils.zeroBytes32
        ).send({from: registrant});       
       
        result = await ens.methods.owner(namehash.hash(subdomain + '.' + domain)).call()
        assert.equal(result, registrant);
        result = await ens.methods.resolver(namehash.hash(subdomain + '.' + domain)).call()
        assert.equal(result, utils.zeroAddress);

        let accountBalance = await ENSSubdomainRegistry.methods.getAccountBalance(usernameHash).call();
        assert(accountBalance, domainPrice, "Registry subdomain account balance wrong");
        let finalRegistrantBalance = await TestToken.methods.balanceOf(registrant).call();
        assert(finalRegistrantBalance, +initialRegistrantBalance-domainPrice, "User final balance wrong")
        let finalRegistryBalance = await TestToken.methods.balanceOf(ENSSubdomainRegistry.address).call();
        assert(finalRegistryBalance, +finalRegistryBalance+domainPrice, "Registry final balance wrong")
        
    });


    xit('should release subdomain with cost', async () => {
        let domain = 'stateofus.eth';
        let subdomain = 'frank';
        let labelHash = web3Utils.sha3(subdomain);
        let registrant = accountsArr[6];
        let domainHash = namehash.hash('stateofus.eth');
        let usernameHash = namehash.hash(subdomain + '.' + domain);
        let domainPrice = await ENSSubdomainRegistry.methods.getPrice(domainHash).call()
        await TestToken.methods.mint(domainPrice).send({from: registrant});
        await TestToken.methods.approve(ENSSubdomainRegistry.address, domainPrice).send({from: registrant});
        await ENSSubdomainRegistry.methods.register(
            labelHash, 
            domainHash,
            utils.zeroAddress,
            utils.zeroBytes32,
            utils.zeroBytes32
        ).send({from: registrant});       

        let initialAccountBalance = await ENSSubdomainRegistry.methods.getAccountBalance(usernameHash).call();
        let initialRegistrantBalance = await TestToken.methods.balanceOf(registrant).call();
        let initialRegistryBalance = await TestToken.methods.balanceOf(ENSSubdomainRegistry.address).call();
        //TODO: Forward time 1 year
        await ENSSubdomainRegistry.methods.release(
            web3Utils.sha3(subdomain), 
            domainHash
        ).send({from: registrant});       
        let finalAccountBalance = await ENSSubdomainRegistry.methods.getAccountBalance(usernameHash).call();
        assert(finalAccountBalance, 0, "Final balance didnt zeroed");
        let finalRegistrantBalance = await TestToken.methods.balanceOf(registrant).call();
        assert(finalRegistrantBalance, +initialRegistrantBalance+initialAccountBalance, "Releaser token balance didnt increase")
        let finalRegistryBalance = await TestToken.methods.balanceOf(ENSSubdomainRegistry.address).call();
        assert(finalRegistryBalance, +initialRegistryBalance-initialAccountBalance, "Registry token balance didnt decrease")
        
    });

    xit('should release transfered subdomain with cost', async () => {
        let domain = 'stateofus.eth';
        let subdomain = 'grace';
        let labelHash = web3Utils.sha3(subdomain);
        let registrant = accountsArr[7];
        let newOwner = accountsArr[8];
        let domainHash = namehash.hash('stateofus.eth');
        let usernameHash = namehash.hash(subdomain + '.' + domain);
        let domainPrice = await ENSSubdomainRegistry.methods.getPrice(domainHash).call()
        await TestToken.methods.mint(domainPrice).send({from: registrant});
        await TestToken.methods.approve(ENSSubdomainRegistry.address, domainPrice).send({from: registrant});
        await ENSSubdomainRegistry.methods.register(
            labelHash, 
            domainHash,
            utils.zeroAddress,
            utils.zeroBytes32,
            utils.zeroBytes32
        ).send({from: registrant});       
        await ens.methods.setOwner(usernameHash, newOwner).send({from: registrant});

        let initialAccountBalance = await ENSSubdomainRegistry.methods.getAccountBalance(usernameHash).call();
        let initialRegistrantBalance = await TestToken.methods.balanceOf(newOwner).call();
        let initialRegistryBalance = await TestToken.methods.balanceOf(ENSSubdomainRegistry.address).call();
        //TODO: Forward time 1 year
        await ENSSubdomainRegistry.methods.release(
            web3Utils.sha3(subdomain), 
            domainHash
        ).send({from: newOwner});       
        let finalAccountBalance = await ENSSubdomainRegistry.methods.getAccountBalance(usernameHash).call();
        assert(finalAccountBalance, 0, "Final balance didnt zeroed");
        let finalRegistrantBalance = await TestToken.methods.balanceOf(newOwner).call();
        assert(finalRegistrantBalance, +initialRegistrantBalance+initialAccountBalance, "New owner token balance didnt increase")
        let finalRegistryBalance = await TestToken.methods.balanceOf(ENSSubdomainRegistry.address).call();
        assert(finalRegistryBalance, +initialRegistryBalance-initialAccountBalance, "Registry token balance didnt decrease")
        
    });

    it('should update subdomain backup owner', async () => {
        let domain = 'stateofus.eth';
        let subdomain = 'heidi';
        let labelHash = web3Utils.sha3(subdomain);
        let registrant = accountsArr[8];
        let newOwner = accountsArr[9];
        let domainHash = namehash.hash('stateofus.eth');
        let usernameHash = namehash.hash(subdomain + '.' + domain);
        let domainPrice = await ENSSubdomainRegistry.methods.getPrice(domainHash).call()
        await TestToken.methods.mint(domainPrice).send({from: registrant});
        await TestToken.methods.approve(ENSSubdomainRegistry.address, domainPrice).send({from: registrant});
        await ENSSubdomainRegistry.methods.register(
            labelHash, 
            domainHash,
            utils.zeroAddress,
            utils.zeroBytes32,
            utils.zeroBytes32
        ).send({from: registrant});       
        await ens.methods.setOwner(usernameHash, newOwner).send({from: registrant});

        await ENSSubdomainRegistry.methods.updateBackupOwner(
            usernameHash
        ).send({from: newOwner});       
        
        let result = await ENSSubdomainRegistry.methods.getBackupOwner(usernameHash).call();
        assert(result, newOwner, "Backup owner not updated");
    });


    xit('should move domain to new registry', async () => {
     
    });

    xit('should release moved domain account balance to backup owner', async () => {
     
    });



    

});
