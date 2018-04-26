// Run with node test/messageTribute-signed.js

const Web3 = require('web3');
const MiniMeTokenFactoryJson = require('../dist/contracts/MiniMeTokenFactory.json');
const MiniMeTokenJson = require('../dist/contracts/MiniMeToken.json');
const MessageTributeJson = require('../dist/contracts/MessageTribute.json');

async function execute(){
    let connectionURL = 'ws://localhost:8546';
    const web3 = new Web3(connectionURL);
    
    accounts = await web3.eth.getAccounts();
        
    let MiniMeTokenFactory = new web3.eth.Contract(MiniMeTokenFactoryJson.abi, null, {data: '0x' + MiniMeTokenFactoryJson.code});
        MiniMeTokenFactory = await MiniMeTokenFactory.deploy({arguments: []}).send({from: accounts[0], gasLimit: 7000000});
    
    let MiniMeToken = new web3.eth.Contract(MiniMeTokenJson.abi, null, {data: '0x' + MiniMeTokenJson.code});
        MiniMeToken = await MiniMeToken.deploy({arguments: [
            MiniMeTokenFactory.options.address,
            "0x0",
            "0x0",
            "Status Test Token",
            18,
            "STT",
            true]}).send({from: accounts[0], gasLimit: 7000000});
    
    let SNT = MiniMeToken;

    let MessageTribute = new web3.eth.Contract(MessageTributeJson.abi, null, {data: '0x' + MessageTributeJson.code});
        MessageTribute = await MessageTribute.deploy({arguments: [MiniMeToken.options.address]})
                                             .send({from: accounts[0], gasLimit: 7000000});


    

    const secret = "0x0000000000000000000000000000000000000000000000000000000000123456";
    
    await SNT.methods.generateTokens(accounts[0], 5000).send({from: accounts[0], gasLimit: 500000});
    await SNT.methods.generateTokens(accounts[1], 5000).send({from: accounts[0], gasLimit: 500000});
    
    
    
    
    // ==================================================================================
    // Actual logic starts here
    // ==================================================================================

    // Account 0 sets a tribute to everyone
    let receipt = await MessageTribute.methods
        .setRequiredTribute("0x0000000000000000000000000000000000000000", 200, true)
        .send({from: accounts[0]});
        
    // Account 1 checks if there's a tribute set
    const fee = web3.utils.toBN(await MessageTribute.methods.getRequiredFee(accounts[0]).call({from: accounts[1]}));
    
    if(fee.gt(0)){ // There's a fee

        // Allow amount transfer
        receipt = await SNT.methods.approve(accounts[0], fee).send({from: accounts[1], gasLimit: 700000});

        // Create message to sign
        const timeLimit = (Date.now() + 0) / 1000;
        const hashedSecret = web3.utils.soliditySha3(accounts[0], secret);
        let message = await MessageTribute.methods.getRequestAudienceHash(accounts[0], hashedSecret, timeLimit).call()

        // We prepare a message to be sent via whisper
        let requestPayload = {
            "type": "request-audience",
            "requestorSignature": await web3.eth.sign(message, accounts[1]),
            "requestor": accounts[1],
            "secret": secret,
            "timeLimit": timeLimit
        }

        // Assume `requestPayload` is a message sent to account0 from account1 using asym key, and topic :tribute
        // account0 receives the message, and if the type is "request-audience" prepares its reply

        const approve = true;
        const waive = false;
        const requestorSignatureHash = web3.utils.soliditySha3(requestPayload.requestorSignature);
        message = await MessageTribute.methods.getGrantAudienceHash(requestorSignatureHash, approve, waive, secret).call()

        // We prepare a reply to be sent via whisper
        let grantPayload  = {
            "type": "grant-audience",
            "grantorSignature": await web3.eth.sign(message, accounts[0]),
            "approve": approve,
            "waive": waive,
            "secret": secret
        }

        // The requestor, account1, would receive the message and invoke grantAudience
        receipt = await MessageTribute.methods.grantAudience(grantPayload.approve, 
                                                    grantPayload.waive, 
                                                    grantPayload.secret, 
                                                    requestPayload.timeLimit, 
                                                    requestPayload.requestorSignature, 
                                                    grantPayload.grantorSignature).send({from: accounts[1], gasLimit: 5000000});
        
        // AudienceGranted contains details if audience was granted or not
        console.dir(receipt.events.AudienceGranted);
    }




    process.exit();
}

execute();