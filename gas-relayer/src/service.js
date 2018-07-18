const EventEmitter = require('events');
const Web3 = require('web3');
const config = require('../config/config.json');

const ContractSettings = require('./contract-settings');
const MessageProcessor = require('./message-processor');


// IDEA: A node should call an API (probably from a status node) to register itself as a 
//      token gas relayer.

console.info("Starting...");
const events = new EventEmitter();

// Web3 Connection
let connectionURL = `${config.node.local.protocol}://${config.node.local.host}:${config.node.local.port}`;
const web3 = new Web3(connectionURL);

web3.eth.net.isListening()
.then(listening => events.emit('web3:connected', connectionURL))
.catch(error => {
  console.error(error);
  process.exit();
});


events.on('web3:connected', connURL => {
  console.info("Connected to '%s'", connURL);
  let settings = new ContractSettings(config, web3, events);
  settings.process();
});


// Setting up Whisper options
const shhOptions = {
  ttl: config.node.whisper.ttl,
  minPow: config.node.whisper.minPow,
};

events.on('setup:complete', (settings) => {
  

  let kId;
  let symKId;

  // Listening to whisper
  web3.shh.addSymKey(config.node.whisper.symKey)
  .then(symKeyId => { 
      symKId = symKeyId;
      return web3.shh.newKeyPair();
    })
  .then(keyId => {
    shhOptions.symKeyId = symKId;
    shhOptions.kId = keyId;

    console.info(`Sym Key: ${config.node.whisper.symKey}`);
    console.info("Topics Available:");
    for(let contract in settings.contracts) {
      console.info("- %s: %s [%s]", settings.getContractByTopic(contract).name, contract,  Object.keys(settings.getContractByTopic(contract).allowedFunctions).join(', '));
      shhOptions.topics = [contract];
      events.emit('server:listen', shhOptions, settings);
    }



    if(config.heartbeat.enabled){

      let heartbeatSymKeyId;
      web3.shh.addSymKey(config.heartbeat.symKey)
        .then(heartbeatSymKeyId => { 

          for(let tokenAddress in settings.getTokens()){

            let heartbeatPayload = settings.getToken(tokenAddress);
            heartbeatPayload.address = tokenAddress;

            setInterval(() => {
                web3.shh.post({ 
                  symKeyID: heartbeatSymKeyId, 
                  sig: keyId,
                  ttl: config.node.whisper.ttl, 
                  powTarget:config.node.whisper.minPow, 
                  powTime: config.node.whisper.powTime,
                  topic: web3.utils.toHex("relay-heartbeat-" + heartbeatPayload.symbol).slice(0, 10),
                  payload: web3.utils.toHex(JSON.stringify(heartbeatPayload))
              }).catch(console.error);
            }, 60000);

          }
      });
    }


  });
});


events.on('server:listen', (shhOptions, settings) => {
  let processor = new MessageProcessor(config, settings, web3, shhOptions.kId);
  web3.shh.subscribe('messages', shhOptions, (error, message, subscription) => processor.process(error, message));
});


// Daemon helper functions

process.on("uncaughtException", function(err) {
    
});

process.once("SIGTERM", function() {
    log("Stopping...");
});