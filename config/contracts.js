module.exports = {
  default: {
    deployment: {
      host: "localhost", 
      port: 8546,
      type: "ws"
    },
    dappConnection: [
      "$WEB3", 
      "ws://localhost:8546",
      "http://localhost:8545"
    ],
    gas: "auto",
    strategy: "explicit",
    contracts: {  
    }
  },
  livenet: {
  },
  testnet: {
  },
  rinkeby: {
  }
}
