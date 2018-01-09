pragma solidity ^0.4.17;

contract UsingENS {

    function ensAddress() internal constant returns (address ensAddress) {
        ensAddress = 0x314159265dD8dbb310642f98f50C066173C1259b; //mainnet
        if (codeSize(ensAddress) == 0) {
           ensAddress = 0x112234455C3a32FD11230C42E7Bccd4A84e02010; //ropsten    
        }
    }

    function codeSize(address _addr) internal constant returns(uint size) {
        if (_addr == 0) { 
            return 0; 
        }
        assembly {
            size := extcodesize(_addr)
        }
    }
}