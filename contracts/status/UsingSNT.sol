pragma solidity ^0.4.17;

contract UsingSNT {

    function sntAddress() internal constant returns (address snt) {
        snt = 0x744d70FDBE2Ba4CF95131626614a1763DF805B9E; //mainnet
        if (codeSize(snt) == 0) {
           snt = 0xc55cF4B03948D7EBc8b9E8BAD92643703811d162; //ropsten    
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