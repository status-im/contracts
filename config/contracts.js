module.exports = {
  // default applies to all environments
  default: {
    // Blockchain node to deploy the contracts
    deployment: {
      host: "localhost", // Host of the blockchain node
      port: 8545, // Port of the blockchain node
      type: "rpc" // Type of connection (ws or rpc),
    },
    // order of connections the dapp should connect to
    dappConnection: [
      "$WEB3",  // uses pre existing web3 object if available (e.g in Mist)
      "ws://localhost:8546",
      "http://localhost:8545"
    ],
    gas: "auto",
    contracts: {
      TestToken: {
        deploy: false
      },
      ERC20Receiver: {
        deploy: false
      },
      Factory: {
        deploy: false
      },
      Instance: { 
        deploy: false
      },
      UpdatableInstance: { 
        deploy: false
      },
      MiniMeToken: {
        deploy: false
      },
      MiniMeTokenFactory: {
        deploy: true
      }
    }
  },
  development: {
    contracts: {
      TestToken: {
        deploy: true
      }
    }
  }
};
