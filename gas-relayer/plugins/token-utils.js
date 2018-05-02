class TokenUtils {
    constructor(tokenConfig){
        this.name = tokenConfig.name || "";
        this.symbol = tokenConfig.symbol || "";
        this.minRelayFactor = tokenConfig.minRelayFactor || 1;
    }

    getFactor(){
        // TODO get price from somewhere
        return 100000;
    }
}


module.exports = TokenUtils;