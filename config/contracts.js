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
      MultiSigWalletWithDailyLimit: {
        deploy: true,
        args: [["$accounts[0]"], 1, 0]
      }
    }
  },
  livenet: {
    contracts: {
      MultiSigWalletWithDailyLimit: {
        deploy: false,
        address: "0xB913626032140A86c77D1fdde4f611A00D589C55"
      }
    }
  },
  testnet: {
    contracts: {
    }
  },
  rinkeby: {
    contracts: {
    }
  }
}
