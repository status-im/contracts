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

    async _validateInput(message){
        const contract = this.settings.getContractByTopic(message.topic);

        if(!/^0x[0-9a-f]{40}$/i.test(message.input.address)){
            this._reply('Invalid address', message);
            return false;
        }
            
        if(contract == undefined){
            this._reply('Invalid topic', message);
            return false;
        }
        
        if(!contract.functionSignatures.includes(message.input.functionName)){
            this._reply('Function not allowed', message);
            return false;
        }
            
        // Get code from address and compare it against the contract code
        if(!contract.isIdentity){
            const code = this.web3.utils.soliditySha3(await this.web3.eth.getCode(message.input.address));
            if(code != contract.code){
                this._reply('Invalid contract code', message);
                return false;
            }
        }  
        return true;
    }

    _extractInput(message){
        let obj = {
            address: null,
            functionName: null,
            functionParameters: null,
            payload: null
        };

        try {
            let parsedObj = JSON.parse(this.web3.utils.toAscii(message.payload));
           
            obj.address = parsedObj.address;
            obj.functionName = parsedObj.encodedFunctionCall.slice(0, 10);
            obj.functionParameters = "0x" + parsedObj.encodedFunctionCall.slice(10);
            obj.payload = parsedObj.encodedFunctionCall;
        } catch(err){
            console.error("Couldn't parse " + message);
        }
        
        message.input = obj;
    }

    /*
    _getFactor(input, contract, gasToken){	
        if(contract.allowedFunctions[input.functionName].isToken){	
            return this.web3.utils.toBN(this.settings.getToken(gasToken).pricePlugin.getFactor());	
        } else {	
            return this.web3.utils.toBN(1);	
        }	
    } */

    async process(error, message){
        if(error){
          console.error(error);
        } else {
            this._extractInput(message);

            const contract = this.settings.getContractByTopic(message.topic);

            console.info("Processing request to: %s, %s", message.input.address, message.input.functionName);

            if(!await this._validateInput(message)) return; // TODO Log

            if(contract.strategy){
                let validationResult = await contract.strategy.execute(message);
                if(!validationResult.success){
                    return this._reply(validationResult.message, message);
                }
            }

            let p = {
                from: this.config.node.blockchain.account,
                to: message.input.address,
                value: 0,
                data: message.input.payload,
                gasPrice: this.config.gasPrice
            };

            this.web3.eth.estimateGas(p)
            .then((estimatedGas) => {
                p.gas = parseInt(estimatedGas * 1.1)
                return this.web3.eth.sendTransaction(p);
            })
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