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
      SafeMath: {
        deploy: false
      },
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
      InstanceStorage: {
        deploy: false
      },
      UpdatableInstance: { 
        deploy: false
      },
      MiniMeToken: {
        deploy: false
      },
      MiniMeTokenFactory: {
        deploy: false
      },
      DelegationProxy: {
        deploy: false
      },
      DelegationProxyFactory: {
        deploy: false
      },
      DelegationProxyView: {
        deploy: false
      },
      DelegationProxyKernel: {
        deploy: false
      },
      TrustNetwork: {
        deploy: false
      },
      ProposalCuration: {
        deploy: false
      },
      ProposalManager: {
        deploy: false
      },
      Democracy: {
        deploy: false
      } 
    }
  },
  development: {
    contracts: {
      MiniMeTokenFactory : {
        deploy: true
      },
      DelegationProxyFactory: {
        deploy: true
      },
      SNT: {
        deploy: true,
        instanceOf: "MiniMeToken",
        args: [
          "$MiniMeTokenFactory",
          0,
          0,
          "TestMiniMeToken",
          18,
          "TST",
          true
        ]
      }
    }, 
    Democracy: {
      deploy: true,
      args: [
        "$SNT",
        "$DelegationProxyFactory"
      ]
    }
  }
};
