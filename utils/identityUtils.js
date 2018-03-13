const web3EthAbi = require("web3-eth-abi");

const _types = {
    ADDRESS: 0,
    ECDSA: 1,
    RSA: 2
}

const _purposes = {
    MANAGEMENT: 1,
    ACTION: 2,
    CLAIM_SIGNER: 3,
    ENCRYPTION: 4,

    NONE: 0
}

const hexToBytes32 = (input) => {
    input = input.replace(/^0x/i,'');
    const stringed = "0000000000000000000000000000000000000000000000000000000000000000" + input;
    return "0x" + stringed.substring(stringed.length - 64, stringed.length); 
}

const _addKey = function(key, purpose, type){
    if(!/^(0x)?[0-9a-f]{0,64}$/i.test(key))
        throw new Error('Key "'+ key +'" is not a valid hex string');

    if (Object.values(_purposes).indexOf(purpose) == -1) 
        throw new Error('Purpose "'+ purpose +'" is not a valid purpose');

    if (Object.values(_types).indexOf(type) == -1) 
        throw new Error('Type "'+ type +'" is not a valid type');

    return web3EthAbi.encodeFunctionCall({
        name: 'addKey',
        type: 'function',
        inputs: [{
            type: 'bytes32',
            name: '_key'
        },{
            type: 'uint256',
            name: '_purpose'
        },{
            type: 'uint256',
            name: '_type'
        }]
    }, [hexToBytes32(key), purpose, type]);
}

const _removeKey = function(key, purpose){
    if(!/^(0x)?[0-9a-f]{0,64}$/i.test(key))
        throw new Error('Key "'+ key +'" is not a valid hex string');

    if (Object.values(_purposes).indexOf(purpose) == -1) 
        throw new Error('Purpose "'+ purpose +'" is not a valid purpose');

    return web3EthAbi.encodeFunctionCall({
        name: 'removeKey',
        type: 'function',
        inputs: [{
            type: 'bytes32',
            name: '_key'
        },{
            type: 'uint256',
            name: '_purpose'
        }]
    }, [hexToBytes32(key), purpose]);
}


const _setMinimumApprovalsByKeyType = function(type, minimumApprovals) {

    if (Object.values(_types).indexOf(type) == -1) 
        throw new Error('Type "'+ type +'" is not a valid type');

    // TODO valdate minimumApprovals

    return web3EthAbi.encodeFunctionCall({
        name: 'setMinimumApprovalsByKeyType',
        type: 'function',
        inputs: [{
            type: 'uint256',
            name: '_type'
        },{
            type: 'uint8',
            name: '_minimumApprovals'
        }]
    }, arguments);
}


const _setupRecovery = function(address){
    if(!/^(0x)?[0-9a-f]{0,40}$/i.test(address))
        throw new Error('Address "'+ address +'" is not a valid Ethereum address.');

    return web3EthAbi.encodeFunctionCall({
        name: 'setupRecovery',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_recoveryContract'
        }]
    }, [address]);
}

const _updateUpdatableInstance = function(address){
    if(!/^(0x)?[0-9a-f]{0,40}$/i.test(address))
        throw new Error('Address "'+ address +'" is not a valid Ethereum address.');

    return web3EthAbi.encodeFunctionCall({
        name: 'updateUpdatableInstance',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_kernel'
        }]
    }, [address]);
}

const _updateRequestUpdatableInstance = function(address){
    if(!/^(0x)?[0-9a-f]{0,40}$/i.test(address))
        throw new Error('Address "'+ address +'" is not a valid Ethereum address.');

    return web3EthAbi.encodeFunctionCall({
        name: 'updateRequestUpdatableInstance',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_kernel'
        }]
    }, [address]);
}

const _updateConfirmUpdatableInstance = function(address){
    if(!/^(0x)?[0-9a-f]{0,40}$/i.test(address))
        throw new Error('Address "'+ address +'" is not a valid Ethereum address.');

    return web3EthAbi.encodeFunctionCall({
        name: 'updateConfirmUpdatableInstance',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_kernel'
        }]
    }, [address]);
}

const _updateCancelUpdatableInstance = function(address){
    if(!/^(0x)?[0-9a-f]{0,40}$/i.test(address))
        throw new Error('Address "'+ address +'" is not a valid Ethereum address.');

    return web3EthAbi.encodeFunctionCall({
        name: 'updateCancelUpdatableInstance',
        type: 'function',
        inputs: []
    }, []);
}




module.exports = {
    types: _types,
    purposes: _purposes,
    encode: {
        addKey: _addKey,
        removeKey: _removeKey,
        setMinimumApprovalsByKeyType: _setMinimumApprovalsByKeyType,
        setupRecovery: _setupRecovery,
        updateUpdatableInstance: _updateUpdatableInstance,
        updateRequestUpdatableInstance: _updateRequestUpdatableInstance,
        updateConfirmUpdatableInstance: _updateConfirmUpdatableInstance,
        updateCancelUpdatableInstance: _updateCancelUpdatableInstance
    }
}