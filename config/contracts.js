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
      MiniMeTokenFactory: {
        deploy: true
      },
      MiniMeToken: {
        deploy: true,
        args:["$MiniMeTokenFactory", "0x0", "0x0", "Status Test Token", 18, "STT", true],
      },
      StatusRoot: {
        instanceOf: "TestStatusNetwork",
        deploy: true,
        args: ["0x0", "$MiniMeToken"],
        onDeploy: [
          "await MiniMeToken.methods.changeController(StatusRoot.address).send()",
          "await StatusRoot.methods.setOpen(true).send()",
        ]
      },
      StickerMarket: {
        args: ["$MiniMeToken"]
      }
    }
  },

  testnet: {
    contracts: {
      MiniMeTokenFactory: {
        deploy: false,
        address: "0x6bFa86A71A7DBc68566d5C741F416e3009804279"
      },
      MiniMeToken: {
        deploy: false,
        address: "0xc55cF4B03948D7EBc8b9E8BAD92643703811d162"
      },
      StatusRoot: {
        instanceOf: "TestStatusNetwork",
        deploy: false,
        address: "0x34358C45FbA99ef9b78cB501584E8cBFa6f85Cef"
      }
    }
  },
  rinkeby: {
    contracts: {
      MiniMeTokenFactory: {
        deploy: false,
        address: "0x5bA5C786845CaacD45f5952E1135F4bFB8855469"
      },
      MiniMeToken: {
        deploy: false,
        address: "0x43d5adC3B49130A575ae6e4b00dFa4BC55C71621"
      },
      StatusRoot: {
        instanceOf: "TestStatusNetwork",
        deploy: false,
        address: "0xEdEB948dE35C6ac414359f97329fc0b4be70d3f1"
      }
    }
  }
}
