const web3EthAbi = require("web3-eth-abi");

const _addFriends = function(friends){
    return web3EthAbi.encodeFunctionCall({
        name: 'addKey',
        type: 'function',
        inputs: [{
            type: 'address[]',
            name: '_friends'
        }]
    }, [friends]);
}

module.exports = {
    encode: {
        addFriends: _addFriends
    }
}