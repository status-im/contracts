const md5 = require('md5');
const erc20ABI = require('../abi/ERC20Token.json');
const ganache = require("ganache-cli");
const Web3 = require('web3');

class MessageProcessor {

    constructor(config, settings, web3, kId){
        this.config = config;
        this.settings = settings;
        this.web3 = web3;
        this.kId = kId;
    }

    _reply(text, message){
        if(message.sig !== undefined){
            this.web3.shh.post({ 
                pubKey: message.sig, 
                sig: this.kId,
                ttl: this.config.node.whisper.ttl, 
                powTarget:this.config.node.whisper.minPow, 
                powTime: this.config.node.whisper.powTime, 
                topic: message.topic, 
                payload: this.web3.utils.fromAscii(text)
            }).catch(console.error);
        }
    }

    async _validateInput(message, input){
        const contract = this.settings.getContractByTopic(message.topic);

        if(!/^0x[0-9a-f]{40}$/i.test(input.address)){
            this._reply('Invalid address', message);
            return false;
        }
            
        if(contract == undefined){
            this._reply('Invalid topic', message);
            return false;
        }
        
        if(!contract.functionSignatures.includes(input.functionName)){
            this._reply('Function not allowed', message);
            return false;
        }
            
        // Get code from address and compare it against the contract code
        if(!contract.isIdentity){
            const code = this.web3.utils.soliditySha3(await this.web3.eth.getCode(input.address));
            if(code != contract.code){
                this._reply('Invalid contract code', message);
                return false;
            }
        }  
        return true;
    }

    async _validateInstance(message, input){
        const contract = this.settings.getContractByTopic(message.topic);
        const instanceCodeHash = this.web3.utils.soliditySha3(await this.web3.eth.getCode(input.address));
        const kernelVerifSignature = this.web3.utils.soliditySha3(contract.kernelVerification).slice(0, 10);
        if(instanceCodeHash == null) return false;

        let verificationResult = await this.web3.eth.call({
            to: contract.factoryAddress, 
            data: kernelVerifSignature + instanceCodeHash.slice(2)});

        return this.web3.eth.abi.decodeParameter('bool', verificationResult);;
    }

    _extractInput(message){
        let obj = {
            address: null,
            functionName: null,
            functionParameters: null,
            payload: null
        };

        try {
            let parsedObj = JSON.parse(this.web3.utils.toAscii(message));
            obj.address = parsedObj.address;
            obj.functionName = parsedObj.encodedFunctionCall.slice(0, 10);
            obj.functionParameters = "0x" + parsedObj.encodedFunctionCall.slice(10);
            obj.payload = parsedObj.encodedFunctionCall;
        } catch(err){
            console.error("Couldn't parse " + message);
        }
        
        return obj;
    }

    _obtainParametersFunc(contract, input){
        const parameterList = this.web3.eth.abi.decodeParameters(contract.allowedFunctions[input.functionName].inputs, input.functionParameters);
        return function(parameterName){
            return parameterList[parameterName];
        }
    }

    _getFactor(input, contract, gasToken){	
        if(contract.allowedFunctions[input.functionName].isToken){	
            return this.web3.utils.toBN(this.settings.getToken(gasToken).pricePlugin.getFactor());	
        } else {	
            return this.web3.utils.toBN(1);	
        }	
    }	
    
    async getBalance(token, input, gasToken){
        // Determining balances of token used
        if(token.symbol == "ETH"){
            return new this.web3.utils.BN(await this.web3.eth.getBalance(input.address));
        } else {
            const Token = new this.web3.eth.Contract(erc20ABI.abi);
            Token.options.address = gasToken;
            return new this.web3.utils.BN(await Token.methods.balanceOf(input.address).call());  
        }
    }

    async _estimateGas(input, gasLimit){
        let web3Sim = new Web3(ganache.provider({
            fork: `${this.config.node.ganache.protocol}://${this.config.node.ganache.host}:${this.config.node.ganache.port}`,
            locked: false,
            gasLimit: 10000000
        }));
        
        let simAccounts = await web3Sim.eth.getAccounts();
        
        let simulatedReceipt = await web3Sim.eth.sendTransaction({
            from: simAccounts[0],
            to: input.address,
            value: 0,
            data: input.payload, 
            gasLimit: gasLimit * 0.95 // 95% of current chain latest gas block limit

        });

        return web3Sim.utils.toBN(simulatedReceipt.gasUsed);
    }

    async process(error, message){
        if(error){
          console.error(error);
        } else {
            
            let input = this._extractInput(message.payload);

            const contract = this.settings.getContractByTopic(message.topic);

            console.info("Processing request to: %s, %s", input.address, input.functionName);

            if(!await this._validateInput(message, input)) return; // TODO Log

            if(contract.strategy){
                let validationResult = contract.strategy(message, input)
                if(validationResult.success){
                    return this._reply(validationResult.message, message);
                }
            }

            const latestBlock = await this.web3.eth.getBlock("latest");
            let estimatedGas = 0;
            try {
                 estimatedGas = await this._estimateGas(input, latestBlock.gasLimit);
                if(gasLimit.lt(estimatedGas)) {
                    return this._reply("Gas limit below estimated gas", message);
                } 
            } catch(exc){
                if(exc.message.indexOf("revert") > -1)
                    return this._reply("Transaction will revert", message);
            }

            let p = {
                from: this.config.node.blockchain.account,
                to: input.address,
                value: 0,
                data: input.payload,
                gas: gasLimit.toString(), 
                gasPrice: this.config.gasPrice
            };

            this.web3.eth.sendTransaction(p)
                .then((receipt) => {
                    return this._reply("Transaction mined;" 
                                        + receipt.transactionHash 
                                        + ';' 
                                        + JSON.stringify(receipt)
                                        , message);
                }).catch((err) => {
                    this._reply("Couldn't mine transaction: " + err.message, message);
                    // TODO log this?
                    console.error(err);
                });
        }
    }  
}

module.exports = MessageProcessor;