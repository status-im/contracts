module.exports = {
  default: {
    enabled: true,
    rpcHost: "localhost", 
    rpcPort: 8545, 
    rpcCorsDomain: {
      auto: true,
      additionalCors: []
    },
    wsRPC: true,
    wsOrigins: { 
      auto: true,
      additionalCors: []
    },
    wsHost: "localhost",
    wsPort: 8546 
  },

  development: {
    ethereumClientName: "geth", 
    networkType: "custom", 
    networkId: 1337,
    isDev: true,
    datadir: ".embark/development/datadir",
    mineWhenNeeded: true, 
    nodiscover: true, 
    maxpeers: 0, 
    proxy: true, 
    targetGasLimit: 8000000, 
    simulatorBlocktime: 0
  },

  testnet: {
    networkType: "testnet",
    syncMode: "light",
    accounts: [
      {
        nodeAccounts: true,
        password: "config/testnet/.password"
      }
    ]
  },

  livenet: {
    networkType: "livenet",
    syncMode: "light",
    rpcCorsDomain: "http://localhost:8000",
    wsOrigins: "http://localhost:8000",
    accounts: [
      {
        nodeAccounts: true,
        password: "config/livenet/.password"
      }
    ]
  },
  
  rinkeby: {
    enabled: true,
    networkType: "rinkeby",
    syncMode: "light",
    rpcHost: "localhost",
    rpcPort: 8545,
    rpcCorsDomain: "http://localhost:8000",
    accounts: [
      {
        nodeAccounts: true,
        password: "config/rinkeby/.password"
      }
    ],
  }
 
};
