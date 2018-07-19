const identityStrategy = () => {



/*
// TODO extract this. Determine strategy depending on contract

            if(contract.isIdentity){
                let validInstance = await this._validateInstance(message, input);
                if(!validInstance){
                    return this._reply("Invalid identity instance", message);
                }
            }
                
            const params = this._obtainParametersFunc(contract, input);

            const token = this.settings.getToken(params('_gasToken'));
            if(token == undefined)
                return this._reply("Token not allowed", message);

            const gasPrice = this.web3.utils.toBN(params('_gasPrice'));
            const gasLimit = this.web3.utils.toBN(params('_gasLimit'));

            // Determine if enough balance for baseToken
            if(contract.allowedFunctions[input.functionName].isToken){
                const Token = new this.web3.eth.Contract(erc20ABI);
                Token.options.address = params('_baseToken');
                const baseToken = new this.web3.utils.BN(await Token.methods.balanceOf(input.address).call()); 
                if(balance.lt(this.web3.utils.BN(params('_value')))){
                    this._reply("Identity has not enough balance for specified value", message);
                    return;
                }
            }

            const gasToken = params('_gasToken');
            const balance = await this.getBalance(token, input, gasToken);
            
            if(balance.lt(this.web3.utils.toBN(gasPrice.mul(gasLimit)))) {
                this._reply("Identity has not enough tokens for gasPrice*gasLimit", message);
                return;
            }


            */




    return {
        success: true,
        message: "Test"
    }
}

module.exports = identityStrategy;