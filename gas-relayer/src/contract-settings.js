class ContractSettings {

    constructor(config, web3, eventEmitter){
        this.tokens = config.tokens;
        this.topics = [];
        this.contracts = config.contracts;
        this.config = config;
        
        this.web3 = web3;
        this.events = eventEmitter;

        this.pendingToLoad = 0;
    }

    process(){
        this._setTokenPricePlugin();
        this._processContracts();
    }

    _setTokenPricePlugin(){	
        for(let token in this.tokens){	
            if(this.tokens[token].pricePlugin !== undefined){	
                let PricePlugin = require(this.tokens[token].pricePlugin);	
                this.tokens[token].pricePlugin = new PricePlugin(this.tokens[token]);	
            }	
        }	
    }

    getTokens(){
        return this.tokens;
    }

    getToken(token){
        return this.tokens[token];
    }

    getContractByTopic(topicName){
        return this.contracts[topicName];
    }

    getTopicName(contractName){
        return this.web3.utils.toHex(contractName).slice(0, 10);
    }

    _obtainContractBytecode(topicName){
        if(this.contracts[topicName].isIdentity) return;

        this.pendingToLoad++;
        this.web3.eth.getCode(this.contracts[topicName].address)
        .then(code => {
            this.contracts[topicName].code = this.web3.utils.soliditySha3(code);
            this.pendingToLoad--;
            if(this.pendingToLoad == 0) this.events.emit("setup:complete", this);
            })
        .catch((err) => {
            console.error("Invalid contract for " + contractName);
            console.error(err);
            process.exit();
            });
    }

    _extractFunctions(topicName){
        const contract = this.getContractByTopic(topicName);

        for(let i = 0; i < contract.allowedFunctions.length; i++){
            contract.allowedFunctions[i].functionName = contract.allowedFunctions[i].function.slice(0, contract.allowedFunctions[i].function.indexOf('('));
      
            // Extracting input
            contract.allowedFunctions[i].inputs = contract.abi.filter(x => x.name == contract.allowedFunctions[i].functionName && x.type == "function")[0].inputs;
      
            // Obtaining function signatures
            let functionSignature = this.web3.utils.sha3(contract.allowedFunctions[i].function).slice(0, 10);
            contract.allowedFunctions[functionSignature] = contract.allowedFunctions[i];
            delete this.contracts[topicName].allowedFunctions[i];
        }
      
        contract.functionSignatures = Object.keys(contract.allowedFunctions);
        this.contracts[topicName] = contract;
    }

    _processContracts(){
        for(let contractName in this.contracts){
            // Obtaining the abis
            this.contracts[contractName].abi = require(this.contracts[contractName].abiFile).abi;
            
            const topicName = this.getTopicName(contractName);

            // Extracting topic
            this.topics.push(topicName);
            this.contracts[topicName] = this.contracts[contractName];
            this.contracts[topicName].name = contractName;
            delete this.contracts[contractName];

            // Obtaining strategy
            if(this.contracts[topicName].strategy){
                const strategy = require(this.contracts[topicName].strategy);	
                this.contracts[topicName].strategy = new strategy(this.web3, this.config, this, this.contracts[topicName]);
            }
            
            this._obtainContractBytecode(topicName);

            this._extractFunctions(topicName);
        }
    }
}


module.exports = ContractSettings;