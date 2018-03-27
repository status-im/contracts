const identityKernelJson = require('../dist/contracts/IdentityKernel.json');
const idUtils = require('../utils/identityUtils.js');

describe('MessageTribute', function() {

    let accounts;
    let SNT;

    this.timeout(0);

    before( function(done) {
        this.timeout(0);

        EmbarkSpec.deployAll({
                "IdentityFactory": {
                    args: ["0xaaaa"],
                    gas: 5000000
                },
                "MiniMeTokenFactory": {},
                "MiniMeToken": {
                    "args": [
                        "$MiniMeTokenFactory",
                        "0x0",
                        "0x0",
                        "Status Test Token",
                        18,
                        "STT",
                        true
                        ]
                },
                "MessageTribute": {
                    "args": ["$MiniMeToken"]
                }
            }, (_accounts) => { 
                accounts = _accounts;  
                SNT = MiniMeToken;    
                done();
            });
    });

    it("Use identities to request audiences", async() => {
        let tx;
        
        tx = await IdentityFactory.methods.createIdentity().send({from: accounts[0]});
        let idAddress0 = tx.events.IdentityCreated.returnValues.instance;
        let identity0 = new web3.eth.Contract(identityKernelJson.abi, idAddress0, {from: accounts[0]});


        tx = await IdentityFactory.methods.createIdentity().send({from: accounts[1]});
        let idAddress1 = tx.events.IdentityCreated.returnValues.instance;
        let identity1 = new web3.eth.Contract(identityKernelJson.abi, idAddress1, {from: accounts[1]});

        tx = await identity0.methods.execute(
            idAddress0, 
            0, 
            idUtils.encode.addKey(accounts[0], idUtils.purposes.ACTION, idUtils.types.ADDRESS)
        ).send({from: accounts[0], gasLimit: 5000000});

        tx = await identity1.methods.execute(
            idAddress1, 
            0, 
            idUtils.encode.addKey(accounts[1], idUtils.purposes.ACTION, idUtils.types.ADDRESS)
        ).send({from: accounts[1], gasLimit: 5000000});

       
        // Adding SNT to identities
        await SNT.methods.generateTokens(idAddress0, 5000).send();
        await SNT.methods.generateTokens(idAddress1, 5000).send();


        // Approving spending of SNT
        let encodedSNTApprove = web3.eth.abi.encodeFunctionCall({name: 'approve', type: 'function', inputs: [{type: 'address', name: '_spender'}, {type: 'uint256', name: '_amount'}]}, [MessageTribute.address, 150]);
        tx = await identity1.methods.execute(
            SNT.address, 
            0, 
            encodedSNTApprove
        ).send({from: accounts[1], gasLimit: 5000000});

        
        // Depositing SNT in MessageTribute contract
        let encodedDepositFunc = web3.eth.abi.encodeFunctionCall({name: 'deposit', type: 'function', inputs: [{type: 'uint256', name: '_value'}]}, [150]);
        tx = await identity1.methods.execute(
            MessageTribute.address, 
            0, 
            encodedDepositFunc
        ).send({from: accounts[1], gasLimit: 5000000});

        
        // Account 0, setting a tribute from everyone
        let encodedSetTribute = web3.eth.abi.encodeFunctionCall({name: 'setRequiredTribute', type: 'function', inputs: [{type: 'address', name: '_to'}, {type: 'uint256', name: '_amount'}, {type: 'bool', name: '_isTribute'}, {type: 'bool', name: '_isPermanent'}]}, ["0x0", 150, true, false]);
        tx = await identity0.methods.execute(
            MessageTribute.address, 
            0, 
            encodedSetTribute
        ).send({from: accounts[0], gasLimit: 5000000});

        // Requesting Audience
        let encodedRequestAudience = web3.eth.abi.encodeFunctionCall({name: 'requestAudience', type: 'function', inputs: [{type: 'address', name: '_from'}, {type: 'bytes32', name: 'hashedSecret'}]}, [idAddress0, "0x0000000000000000000000000000000000000000000000000000000000000000"]);
        tx = await identity1.methods.execute(
            MessageTribute.address, 
            0, 
            encodedRequestAudience
        ).send({from: accounts[1], gasLimit: 5000000});

        assert.equal(
            await MessageTribute.methods.hasPendingAudience(idAddress0, idAddress1).call(),
            true,
            "Must have a pending audience");


    });
});