
// This has been tested with the real Ethereum network and Testrpc.
// Copied and edited from: https://gist.github.com/xavierlepretre/d5583222fde52ddfbc58b7cfa0d2d0a9
exports.assertReverts = (contractMethodCall, maxGasAvailable) => {
    return new Promise((resolve, reject) => {
        try {
            resolve(contractMethodCall())
        } catch (error) {
            reject(error)
        }
    })
        .then(tx => {
            assert.equal(tx.receipt.gasUsed, maxGasAvailable, "tx successful, the max gas available was not consumed")
        })
        .catch(error => {
            if ((error + "").indexOf("invalid opcode") < 0 && (error + "").indexOf("out of gas") < 0) {
                // Checks if the error is from TestRpc. If it is then ignore it.
                // Otherwise relay/throw the error produced by the above assertion.
                // Note that no error is thrown when using a real Ethereum network AND the assertion above is true.
                throw error
            }
        })
}

exports.listenForEvent = event => new Promise((resolve, reject) => {
    event({}, (error, response) => {
        if (!error) {
            resolve(response.args)
        } else {
            reject(error)
        }
        event.stopWatching()
    })
});

exports.eventValues = (receipt, eventName) => {
    if(receipt.events[eventName])
        return receipt.events[eventName].returnValues;
}

exports.addressToBytes32 = (address) => {
    const stringed = "0000000000000000000000000000000000000000000000000000000000000000" + address.slice(2);
    return "0x" + stringed.substring(stringed.length - 64, stringed.length); 
}

exports.pubKeyToAddress = (contactCode) => {
    if(contactCode.length != 132 || contactCode.substring(0,4) != "0x04") {
        throw "Invalid contact code: " +contactCode;
    }
    return web3.utils.toChecksumAddress("0x" + web3.utils.soliditySha3({t: 'bytes', v: ("0x" + contactCode.substring(4))}).substring(26));
}


// OpenZeppelin's expectThrow helper -
// Source: https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/test/helpers/expectThrow.js
exports.expectThrow = async promise => {
    try {
      await promise;
    } catch (error) {
      // TODO: Check jump destination to destinguish between a throw
      //       and an actual invalid jump.
      const invalidOpcode = error.message.search('invalid opcode') >= 0;
      // TODO: When we contract A calls contract B, and B throws, instead
      //       of an 'invalid jump', we get an 'out of gas' error. How do
      //       we distinguish this from an actual out of gas event? (The
      //       testrpc log actually show an 'invalid jump' event.)
      const outOfGas = error.message.search('out of gas') >= 0;
      const revert = error.message.search('revert') >= 0;
      assert(
        invalidOpcode || outOfGas || revert,
        'Expected throw, got \'' + error + '\' instead',
      );
      return;
    }
    assert.fail('Expected throw not received');
  };

  

exports.assertJump = (error) => {
    assert(error.message.search('revert') > -1, 'Revert should happen');
}


var callbackToResolve = function (resolve, reject) {
    return function (error, value) {
            if (error) {
                reject(error);
            } else {
                resolve(value);
            }
        };
};

exports.promisify = (func) =>
    (...args) => {
        return new Promise((resolve, reject) => {
        const callback = (err, data) => err ? reject(err) : resolve(data);
        func.apply(this, [...args, callback]);
        });
    }
        

// This has been tested with the real Ethereum network and Testrpc.
// Copied and edited from: https://gist.github.com/xavierlepretre/d5583222fde52ddfbc58b7cfa0d2d0a9
exports.assertReverts = (contractMethodCall, maxGasAvailable) => {
    return new Promise((resolve, reject) => {
        try {
            resolve(contractMethodCall())
        } catch (error) {
            reject(error)
        }
    })
        .then(tx => {
            assert.equal(tx.receipt.gasUsed, maxGasAvailable, "tx successful, the max gas available was not consumed")
        })
        .catch(error => {
            if ((error + "").indexOf("invalid opcode") < 0 && (error + "").indexOf("out of gas") < 0) {
                // Checks if the error is from TestRpc. If it is then ignore it.
                // Otherwise relay/throw the error produced by the above assertion.
                // Note that no error is thrown when using a real Ethereum network AND the assertion above is true.
                throw error
            }
        })
}

exports.listenForEvent = event => new Promise((resolve, reject) => {
    event({}, (error, response) => {
        if (!error) {
            resolve(response.args)
        } else {
            reject(error)
        }
        event.stopWatching()
    })
});

exports.eventValues = (receipt, eventName) => {
    if(receipt.events[eventName])
        return receipt.events[eventName].returnValues;
}

exports.addressToBytes32 = (address) => {
    const stringed = "0000000000000000000000000000000000000000000000000000000000000000" + address.slice(2);
    return "0x" + stringed.substring(stringed.length - 64, stringed.length); 
}


// OpenZeppelin's expectThrow helper -
// Source: https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/test/helpers/expectThrow.js
exports.expectThrow = async promise => {
    try {
      await promise;
    } catch (error) {
      // TODO: Check jump destination to destinguish between a throw
      //       and an actual invalid jump.
      const invalidOpcode = error.message.search('invalid opcode') >= 0;
      // TODO: When we contract A calls contract B, and B throws, instead
      //       of an 'invalid jump', we get an 'out of gas' error. How do
      //       we distinguish this from an actual out of gas event? (The
      //       testrpc log actually show an 'invalid jump' event.)
      const outOfGas = error.message.search('out of gas') >= 0;
      const revert = error.message.search('revert') >= 0;
      assert(
        invalidOpcode || outOfGas || revert,
        'Expected throw, got \'' + error + '\' instead',
      );
      return;
    }
    assert.fail('Expected throw not received');
  };

exports.assertJump = (error) => {
    assert(error.message.search('revert') > -1, 'Revert should happen');
}

var callbackToResolve = function (resolve, reject) {
    return function (error, value) {
            if (error) {
                reject(error);
            } else {
                resolve(value);
            }
        };
};

exports.promisify = (func) =>
    (...args) => {
        return new Promise((resolve, reject) => {
        const callback = (err, data) => err ? reject(err) : resolve(data);
        func.apply(this, [...args, callback]);
        });
    }
    
exports.zeroAddress = '0x0000000000000000000000000000000000000000';
exports.zeroBytes32 = "0x0000000000000000000000000000000000000000000000000000000000000000";
exports.timeUnits = {
    seconds: 1,
    minutes: 60,
    hours: 60 * 60,
    days: 24 * 60 * 60,
    weeks: 7 * 24 * 60 * 60,
    years: 365 * 24 * 60 * 60
}

exports.ensureException = function(error) {
    assert(isException(error), error.toString());
};


exports.getEVMException = async function(sendFn, sender=null, gasLimit=8000000) {
    var error = null;
    try {
        await sendFn.estimateGas({ from: sender, gas: gasLimit});
    } catch(e) {
        var a = e.toString().split(": ");
        
        if(a[0] != "RuntimeError" || a[1] != "VM Exception while processing transaction") {
          throw e;
        }
        
        switch (a[2]){
          case "out of gas":
          case "invalid opcode":
          case "invalid JUMP":
          case "stack overflow":
          case "revert":
            error = a[2]
            break;
          default:
            if(a[2].startsWith("revert ")){
              error = a[2].substring(7)
            } else {
              error = a[2];
            }  
        }
    } finally {
        return error;
    }
}

exports.assertEVMException = async function(sendFn, error="") {
    try {
        await sendFn;
        return false;
    } catch (e) {
        let strError = e.toString();
        if(error == ""){
            return strError.includes('invalid opcode') || strError.includes('invalid JUMP') || strError.includes('revert');   
        } else {
            return strError.includes(error);
        }
    }
    
};



exports.strictEVMException = async function(sendFn, error="") {
    try {
        await sendFn;
        return false;
    } catch (e) {
        let strError = e.toString();
        if(error == ""){
            return strError.includes('invalid opcode') || strError.includes('invalid JUMP') || strError.includes('revert');   
        } else {
            return strError.includes(error);
        }
    }
    
};



function isException(error) {
    let strError = error.toString();
    return strError.includes('invalid opcode') || strError.includes('invalid JUMP') || strError.includes('revert');
}

exports.increaseTime = async (amount) => {
    return new Promise(function(resolve, reject) {
      web3.currentProvider.send(
        {
          jsonrpc: '2.0',
          method: 'evm_increaseTime',
          params: [+amount],
          id: new Date().getSeconds()
        }, (error) => {
            if (error) {
                reject(err);
            } else {
                web3.currentProvider.send({
                    jsonrpc: '2.0',
                    method: 'evm_mine',
                    params: [],
                    id: new Date().getSeconds()
                }, (error) => {
                    if (error) {
                        reject(err);
                    }else {
                        resolve();
                    }
                })
            }
        })
    });
}

exports.setTime = async (timestamp) => {
    return new Promise(function(resolve, reject) { 
        web3.currentProvider.send({
          jsonrpc: '2.0',
          method: 'evm_mine',
          params: [+timestamp],
          id: new Date().getSeconds()
        }, (error,s)=>{
            if(error) {
                reject(error);
            } else {
                resolve();
            }
        })
    })
}

exports.increaseBlock = (amount) => {
    return new Promise(function(resolve, reject) {
        web3.currentProvider.send(
            {
            jsonrpc: '2.0',
            method: 'evm_mine',
            params: [],
            id: new Date().getSeconds()
            },
            (error,s)=>{
                if(error) {
                    reject(error);
                } else {
                    if(amount == 1) {
                        resolve()
                    }else {
                        exports.increaseBlock(amount-1).then(() => {
                            resolve();
                        })
                    }
                    
                }
            })
    })
}

exports.setBlockNumber = (newBlockNumber) => {
    return new Promise((resolve, reject) => {
        web3.eth.getBlockNumber().then((blockNumber) => {
            if(blockNumber > newBlockNumber) {
                reject("Cannot go back");
            } else if (blockNumber < newBlockNumber) {
                exports.increaseBlock(newBlockNumber - blockNumber).then(()=>{
                    resolve();
                })
            } else {
                resolve();
            }
        })
    })  
}

exports.addGas = (call, from, amount=1010) => {
    return new Promise((resolve, reject) => {
        call.estimateGas().then((gas) => {
            call.send({
                gas: gas+amount,
                from: from
            }).on('error', reject).then(resolve);
        })
    })
}

