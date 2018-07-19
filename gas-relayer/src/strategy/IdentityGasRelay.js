const erc20ABI = require('../../abi/ERC20Token.json');
const ganache = require("ganache-cli");
const Web3 = require('web3');

class IdentityStrategy  {

    constructor(web3, config, settings, contract){
        this.web3 = web3;
        this.settings = settings;
        this.contract = contract;
        this.config = config;
    }

    _obtainParametersFunc(message){
        const parameterList = this.web3.eth.abi.decodeParameters(this.contract.allowedFunctions[message.input.functionName].inputs, message.input.functionParameters);
        return function(parameterName){
            return parameterList[parameterName];
        }
    }

    async _validateInstance(message){
        const instanceCodeHash = this.web3.utils.soliditySha3(await this.web3.eth.getCode(message.input.address));
        const kernelVerifSignature = this.web3.utils.soliditySha3(this.contract.kernelVerification).slice(0, 10);
        if(instanceCodeHash == null) return false;
    
        let verificationResult = await this.web3.eth.call({
            to: this.contract.factoryAddress, 
            data: kernelVerifSignature + instanceCodeHash.slice(2)});
    
        return this.web3.eth.abi.decodeParameter('bool', verificationResult);;
    }

    async getBalance(token, message, gasToken){
        // Determining balances of token used
        if(token.symbol == "ETH"){
            return new this.web3.utils.BN(await this.web3.eth.getBalance(message.input.address));
        } else {
            const Token = new this.web3.eth.Contract(erc20ABI.abi);
            Token.options.address = gasToken;
            return new this.web3.utils.BN(await Token.methods.balanceOf(message.input.address).call());  
        }
    }

    async _estimateGas(message, gasLimit){
        let web3Sim = new Web3(ganache.provider({
            fork: `${this.config.node.ganache.protocol}://${this.config.node.ganache.host}:${this.config.node.ganache.port}`,
            locked: false,
            gasLimit: 10000000
        }));
        
        let simAccounts = await web3Sim.eth.getAccounts();
        
        let simulatedReceipt = await web3Sim.eth.sendTransaction({
            from: simAccounts[0],
            to: message.input.address,
            value: 0,
            data: message.input.payload, 
            gasLimit: gasLimit * 0.95 // 95% of current chain latest gas block limit

        });

        return web3Sim.utils.toBN(simulatedReceipt.gasUsed);
    }

    async execute(message){

        if(this.contract.isIdentity){
            let validInstance = await this._validateInstance(message);
            if(!validInstance){
                return { success: false, message: "Invalid identity instance" };
            }
        }

        const params = this._obtainParametersFunc(message);

        // Verifying if token is allowed
        const token = this.settings.getToken(params('_gasToken'));
        if(token == undefined)
            return { success: false, message: "Token not allowed" };

        
        // Determine if enough balance for baseToken
        const gasPrice = this.web3.utils.toBN(params('_gasPrice'));
        const gasLimit = this.web3.utils.toBN(params('_gasLimit'));
        if(this.contract.allowedFunctions[message.input.functionName].isToken){
            const Token = new this.web3.eth.Contract(erc20ABI);
            Token.options.address = params('_baseToken');
            const baseToken = new this.web3.utils.BN(await Token.methods.balanceOf(message.input.address).call()); 
            if(balance.lt(this.web3.utils.BN(params('_value')))){
                return { success: false, message: "Identity has not enough balance for specified value" };
            }
        }

        // gasPrice * limit calculation
        const gasToken = params('_gasToken');
        const balance = await this.getBalance(token, message, gasToken);
        if(balance.lt(this.web3.utils.toBN(gasPrice.mul(gasLimit)))) {
            return { success: false, message: "Identity has not enough tokens for gasPrice*gasLimit"};
        }


        const latestBlock = await this.web3.eth.getBlock("latest");
        let estimatedGas = 0;
        try {
            estimatedGas = await this._estimateGas(message, latestBlock.gasLimit);
            if(gasLimit.lt(estimatedGas)) {
                return { success: false, message: "Gas limit below estimated gas" };
            } 
        } catch(exc){
            if(exc.message.indexOf("revert") > -1)
                return { success: false, message: "Transaction will revert" };
        }

        return {
            success: true,
            message: "Test"
        };
    }

}

module.exports = IdentityStrategy;