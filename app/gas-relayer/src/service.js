const md5 = require('md5');
const Web3 = require('web3');
const config = require('../config/config.json');
const web3 = new Web3(`${config.whisper.protocol}://${config.whisper.host}:${config.whisper.port}`);

const erc20ABI = require('../abi/ERC20.json');

console.info("Starting...")

// TODO A node should call an API (probably from a status node) to register itself as a 
//      token gas relayer.

async function start(){
for(token in config.tokens){
  if(config.tokens[token].pricePlugin !== undefined){
    let PricePlugin = require(config.tokens[token].pricePlugin);
    config.tokens[token].pricePlugin = new PricePlugin(config.tokens)
  }
}

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
let symKId;
// Listening to whisper

web3.shh.addSymKey(config.whisper.symKey)
  .then(symKeyId => { 
    symKId = symKeyId;
    return web3.shh.newKeyPair();
    })
  .then(keyId => {
    shhOptions.symKeyId = symKId;
    
    kId = keyId;

    console.info(`Sym Key: ${config.whisper.symKey}`);
    console.info("Topics Available:");
    
    config.topics = [];
    for(let contractName in config.contracts) {
      console.info("- %s: %s [%s]", config.contracts[contractName].name, contractName,  Object.keys(config.contracts[contractName].allowedFunctions).join(', '));
      shhOptions.topics = [contractName];
      web3.shh.subscribe('messages', shhOptions, processMessages);
    }

    console.info("Started.");
    console.info("Listening for messages...")
  });
  


const reply = async function(text, message){
  try {
    if(message.sig !== undefined){
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
    
    const params = web3.eth.abi.decodeParameters(contract.allowedFunctions[functionName].inputs, functionParameters);
    const token = config.tokens[params[contract.allowedFunctions[functionName].gasToken]];
    if(token == undefined){
      return reply("Token not allowed", message);
    }
    
    const gasPrice = web3.utils.toBN(params[contract.allowedFunctions[functionName].gasPrice]);
    const gasMinimal = web3.utils.toBN(params[contract.allowedFunctions[functionName].gasMinimal]);


    // Determining balances of gasPrice
    let balance;
    if(token.symbol == "ETH")
      balance = new web3.utils.BN(await web3.eth.getBalance(address));
    else {
      const Token = new web3.eth.Contract(erc20ABI);
      Token.options.address = params[contract.allowedFunctions[functionName].gasToken];
      balance = new web3.utils.BN(await Token.methods.balanceOf(address).call());  
    }

    if(balance.lt(web3.utils.toBN(gasPrice.mul(gasMinimal)))){
      return reply("Not enough balance", message);
    }

    // Determine if enough balance for baseToken
    if(contract.allowedFunctions[functionName].isToken){
      const Token = new web3.eth.Contract(erc20ABI);
      Token.options.address = params[contract.allowedFunctions[functionName].token];
      balance = new web3.utils.BN(await Token.methods.balanceOf(address).call()); 
      if(balance.lt(web3.utils.BN(params[contract.allowedFunctions[functionName].value]))){
        return reply("Not enough balance", message);
      }   
    }

    // Obtain factor
    let factor;
    if(contract.allowedFunctions[functionName].isToken){
      factor = config.tokens[tokenAddress].pricePlugin.getFactor();
    } else {
      factor = 1;
    }

    // TODO Determine cost of running function in ether
    // TODO Determine if gas price offered is worth at least the minimum

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

