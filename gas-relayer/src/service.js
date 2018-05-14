const EventEmitter = require('events');
const Web3 = require('web3');
const config = require('../config/config.json');

const ContractSettings = require('./contract-settings');
const MessageProcessor = require('./message-processor');


// TODO A node should call an API (probably from a status node) to register itself as a 
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


events.on('setup:complete', (settings) => {
  // Setting up Whisper options
  const shhOptions = {
    ttl: config.node.whisper.ttl,
    minPow: config.node.whisper.minPow,
  };

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