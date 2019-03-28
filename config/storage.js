module.exports = {
  default: {
    enabled: true,
    ipfs_bin: "ipfs",
    available_providers: ["ipfs"],
    upload: {
      provider: "ipfs",
      host: "localhost",
      port: 5001
    },
    dappConnection: [
      {
        provider:"ipfs",
        host: "localhost",
        port: 5001,
        getUrl: "http://localhost:8080/ipfs/"
      }
    ]
  },
  development: {
    enabled: true,
    upload: {
      provider: "ipfs",
      host: "localhost",
      port: 5001,
      getUrl: "http://localhost:8080/ipfs/"
    }
  },

  testnet: {
  },

  livenet: {
  },

  rinkeby: {
  }
};