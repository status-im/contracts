module.exports = {
  default: {
    enabled: true,
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
