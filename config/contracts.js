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
    strategy: "explicit",
    contracts: {          
      "MiniMeTokenFactory": {
        "deploy": true
      },
      "MiniMeToken": {
        "deploy": true,
        "args":["$MiniMeTokenFactory", "0x0", "0x0", "Status Test Token", 18, "STT", true],
      },
      "StatusRoot": {
        "instanceOf": "TestStatusNetwork",
        "deploy": true,
        "args": ["0x0", "$MiniMeToken"],
        "onDeploy": [
          "await MiniMeToken.methods.changeController(StatusRoot.address).send()",
          "await StatusRoot.methods.setOpen(true).send()",
        ]
      },
      "DelegationBase": {
        "args": [ "0x0" ]
      },
      "DelegationInit": {
      },
      "DelegationFactory": {
        "args": ["$DelegationBase", "$DelegationInit", "0x0"]
      },        
      "ProposalBase": {},
      "ProposalInit": {},
      "ProposalFactory": {
          "args": ["$ProposalBase", "$ProposalInit", "0x0"]
      }
      
    }
  },

  development: {
    deployment: {
      accounts: [
        {
          privateKey: "b2ab40d549e67ba67f278781fec03b3a90515ad4d0c898a6326dd958de1e46fa",
          balance: "5 ether"  // You can set the balance of the account in the dev environment
                              // Balances are in Wei, but you can specify the unit with its name
        }
      ]
    }
  },
  testnet: {
    contracts: {
      "MiniMeTokenFactory": {
        "deploy": false,
        "address": "0x6bFa86A71A7DBc68566d5C741F416e3009804279"
      },
      "MiniMeToken": {
        "deploy": false,
        "address": "0xc55cF4B03948D7EBc8b9E8BAD92643703811d162"
      },
      "StatusRoot": {
        "instanceOf": "TestStatusNetwork",
        "deploy": false,
        "address": "0x34358C45FbA99ef9b78cB501584E8cBFa6f85Cef"
      }
    }
  },
  rinkeby: {
    contracts: {
      "MiniMeTokenFactory": {
        "deploy": false,
        "address": "0x5bA5C786845CaacD45f5952E1135F4bFB8855469"
      },
      "MiniMeToken": {
        "deploy": false,
        "address": "0x43d5adC3B49130A575ae6e4b00dFa4BC55C71621"
      },
      "StatusRoot": {
        "instanceOf": "TestStatusNetwork",
        "deploy": false,
        "address": "0xEdEB948dE35C6ac414359f97329fc0b4be70d3f1"
      }
    }
  }
}
