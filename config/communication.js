module.exports = {
  default: {
    enabled: false,
    provider: "whisper", 
    available_providers: ["whisper"], 
  },

  development: {
    connection: {
      host: "localhost",
      port: 8546, 
      type: "ws" 
    }
  },
  testnet: {
  },
  livenet: {
  },
  rinkeby: {
  }
  
};
