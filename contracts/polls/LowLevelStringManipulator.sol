pragma solidity ^0.4.11;

contract LowLevelStringManipulator {

////////////////////
// Internal helper functions to manipulate strings
/////////////////

    function strConcat(string _a, string _b, string _c, string _d, string _e) internal returns (string){
        bytes memory _ba = bytes(_a);
        bytes memory _bb = bytes(_b);
        bytes memory _bc = bytes(_c);
        bytes memory _bd = bytes(_d);
        bytes memory _be = bytes(_e);
        string memory abcde = new string(_ba.length + _bb.length + _bc.length + _bd.length + _be.length);
        bytes memory babcde = bytes(abcde);
        uint k = 0;
        for (uint i = 0; i < _ba.length; i++) babcde[k++] = _ba[i];
        for (i = 0; i < _bb.length; i++) babcde[k++] = _bb[i];
        for (i = 0; i < _bc.length; i++) babcde[k++] = _bc[i];
        for (i = 0; i < _bd.length; i++) babcde[k++] = _bd[i];
        for (i = 0; i < _be.length; i++) babcde[k++] = _be[i];
        return string(babcde);
    }

    function strConcat(string _a, string _b, string _c, string _d) internal returns (string) {
        return strConcat(_a, _b, _c, _d, "");
    }

    function strConcat(string _a, string _b, string _c) internal returns (string) {
        return strConcat(_a, _b, _c, "", "");
    }

    function strConcat(string _a, string _b) internal returns (string) {
        return strConcat(_a, _b, "", "", "");
    }

    function uint2str(uint a) internal returns (string) {
        return bytes32ToString(uintToBytes(a));
    }

    function uintToBytes(uint v) internal constant returns (bytes32 ret) {
        if (v == 0) {
            ret = '0';
        }
        else {
            while (v > 0) {
                ret = bytes32(uint(ret) / (2 ** 8));
                ret |= bytes32(((v % 10) + 48) * 2 ** (8 * 31));
                v /= 10;
            }
        }
        return ret;
    }

    function bytes32ToString (bytes32 data) internal constant returns (string) {
        bytes memory bytesString = new bytes(32);
        for (uint j=0; j<32; j++) {
            byte char = byte(bytes32(uint(data) * 2 ** (8 * j)));
            if (char != 0) {
                bytesString[j] = char;
            }
        }
        return string(bytesString);
    }

    function getTokenNameSymbol(address tokenAddr) internal returns (string name, string symbol) {
        return (getString(tokenAddr, bytes4(sha3("name()"))),getString(tokenAddr, bytes4(sha3("symbol()"))));
    }

    function getString(address _dst, bytes4 sig) internal returns(string) {
        string memory s;
        bool success1;
        bool success2;
        assembly {
                let x := mload(0x40)   //Find empty storage location using "free memory pointer"
                mstore(x,sig) //Place signature at begining of empty storage

                success1 := call(      //This is the critical change (Pop the top stack value)
                                    5000, //5k gas
                                    _dst, //To addr
                                    0,    //No value
                                    x,    //Inputs are stored at location x
                                    0x04, //Inputs are 36 byes long
                                    x,    //Store output over input (saves space)
                                    0x80) //Outputs are 32 bytes long

                let strL := mload(add(x, 0x20))   // Load the length of the sring

                jumpi(ask_more, gt(strL, 64))

                mstore(0x40,add(x,add(strL, 0x40)))

                s := add(x,0x20)
            ask_more:
                mstore(x,sig) //Place signature at begining of empty storage

                success2 := call(      //This is the critical change (Pop the top stack value)
                                    5000, //5k gas
                                    _dst, //To addr
                                    0,    //No value
                                    x,    //Inputs are stored at location x
                                    0x04, //Inputs are 36 byes long
                                    x,    //Store output over input (saves space)
                                    add(0x40, strL)) //Outputs are 32 bytes long

                mstore(0x40,add(x,add(strL, 0x40)))
                s := add(x,0x20)

        }
        if ((!success1)||(!success2)) throw;
        return s;
    }

}
