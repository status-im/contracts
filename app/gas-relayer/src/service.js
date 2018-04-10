const md5 = require('md5');
const Web3 = require('web3');
const config = require('../config/config.json');
const web3 = new Web3(`${config.whisper.protocol}://${config.whisper.host}:${config.whisper.port}`);

const erc20ABI = require('../abi/ERC20.json');

console.info("Starting...")

async function start(){
config.topics = [];
for(let contractName in config.contracts){
  
 // Obtaining the abis
 config.contracts[contractName].abi = require(config.contracts[contractName].abiFile); 

  const lngt = config.contracts[contractName].allowedFunctions.length;
  for(i = 0; i < lngt; i++){
      config.contracts[contractName].allowedFunctions[i].functionName = config.contracts[contractName].allowedFunctions[i].function.slice(0, config.contracts[contractName].allowedFunctions[i].function.indexOf('('));

      // Extracting input
      config.contracts[contractName].allowedFunctions[i].inputs = config.contracts[contractName].abi.filter(x => x.name == config.contracts[contractName].allowedFunctions[i].functionName && x.type == "function")[0].inputs;

      // Obtaining function signatures
      let functionSignature = web3.utils.sha3(config.contracts[contractName].allowedFunctions[i].function).slice(0, 10);
      config.contracts[contractName].allowedFunctions[functionSignature] = config.contracts[contractName].allowedFunctions[i];
      delete config.contracts[contractName].allowedFunctions[i];
      
  }

  config.contracts[contractName].functionSignatures = Object.keys(config.contracts[contractName].allowedFunctions);

  // Extracting topics and available functions
  let topicName = web3.utils.toHex(contractName).slice(0, 10);
  config.topics.push(topicName);
  config.contracts[topicName] = config.contracts[contractName];
  config.contracts[topicName].name = contractName;
  delete config.contracts[contractName];

  // Get Contract Bytecode
  let contractAddress = config.contracts[topicName].address;
  if(config.contracts[topicName].isIdentity){
    const lastKernelSignature = "0x4ac99424";
    let kernel = await web3.eth.call({to: config.contracts[topicName].factoryAddress, data: lastKernelSignature});
    contractAddress = '0x' + kernel.slice(26);
  }


  try {
    config.contracts[topicName].code = md5(await web3.eth.getCode(contractAddress));
  } catch(err){
    console.error("Invalid contract for " + contractName);
    console.error(err);
    process.exit();
  }
}


// Setting up Whisper options
const shhOptions = {
  ttl: config.whisper.ttl,
  minPow: config.whisper.minPow,
};

let kId;

// Listening to whisper
web3.shh.addPrivateKey(config.whisper.privateKey)
  .then((keyId) => {
    shhOptions.privateKeyID = keyId;
    kId = keyId;

    web3.shh.getPublicKey(keyId).then(pk => {
      console.info(`Public Key: ${pk}`);
      console.info("Topics Available:");
      config.topics = [];
      for(let contractName in config.contracts) {
        console.info("- %s: %s [%s]", config.contracts[contractName].name, contractName,  Object.keys(config.contracts[contractName].allowedFunctions).join(', '));
      }
    });

    console.info("Started.");
    console.info("Listening for messages...")
    web3.shh.subscribe('messages', shhOptions, processMessages);
  });
  


const reply = async function(text, message){
  try {
    if(message.sig){
      let shhOptions = { 
        pubKey: message.sig, 
        sig: kId,
        ttl: config.whisper.ttl, 
        powTarget:config.whisper.minPow, 
        powTime: config.whisper.powTime, 
        topic: message.topic, 
        payload: web3.utils.fromAscii(text)
      };
      await web3.shh.post(shhOptions);
    }
  } catch(Err){
    // TODO
    console.error(Err);
  }
}


// Process individual whisper message
const processMessages = async function(error, message, subscription){
  if(error){
    // TODO log
    console.error(error);
  } else {
    const address = message.payload.slice(0, 42);
    const functionName = '0x' + message.payload.slice(42, 50);
    const functionParameters = '0x' + message.payload.slice(50);
    const payload = '0x' + message.payload.slice(42);
    
    console.info("Processing request to: %s, %s", address, functionName);

    if(!/^0x[0-9a-f]{40}$/i.test(address))
      return reply('Invalid address', message);

    if(config.contracts[message.topic] == undefined)
      return reply('Invalid topic', message);

    const contract = config.contracts[message.topic];
    if(!contract.functionSignatures.includes(functionName))
      return reply('Function not allowed', message) // TODO Log this

    // Get code from address and compare it against the contract code
    const code = md5(await web3.eth.getCode(address));
    if(code != contract.code){
      return reply('Invalid contract code', message); // TODO Log this
    }
    
    // Determining balances
    const params = web3.eth.abi.decodeParameters(contract.allowedFunctions[functionName].inputs, functionParameters);
    let balance;
    if(contract.isIdentity){
      if(contract.allowedFunctions[functionName].isToken){
        const Token = new web3.eth.Contract(erc20ABI, params[contracts.allowedFunctions[functionName].token]);
        balance = new web3.utils.BN(await Token.methods.balanceOf(address).call());
      } else {
        balance = new web3.utils.BN(await web3.eth.getBalance(address));
      }
    } else {
      // TODO SNT Controller
    }

    // Estimating gas
    let estimatedGas = new web3.utils.BN(await web3.eth.estimateGas({
      to: address,
      data: params[contracts.allowedFunctions[functionName].data]
    }));
    

    // TODO determine if balance is enough

    web3.eth.sendTransaction({
        from: config.blockchain.account,
        to: address,
        value: 0,
        data: payload
    })
    .then(function(receipt){
      return reply("Transaction mined;" + receipt.transactionHash, message);
    }).catch(function(err){
      reply("Couldn't mine transaction", message);
      // TODO log this?
    //console.error(err);
    });
  }
}

}





start();






// Daemon helper functions

process.on("uncaughtException", function(err) {
    
});

process.on("SIGUSR1", function() {
    log("Reloading...");


    log("Reloaded.");
});

process.once("SIGTERM", function() {
    log("Stopping...");
});

