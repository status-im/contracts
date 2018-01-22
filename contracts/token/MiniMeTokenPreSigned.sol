pragma solidity ^0.4.18;

import "./MiniMeToken.sol";

contract MiniMeTokenPreSigned is MiniMeToken {

    mapping (address => uint256) public nonce;
    
    function transferPreSigned(uint8[] _sigV, bytes32[] _sigR, bytes32[] _sigS, address[] _to, uint[] _value, uint[] _fee, uint[] _nonce) public {
        uint len = _sigR.length;
        require(len == _sigS.length && len == _sigV.length);
        for (uint i = 0; i < len; i++) {
            transferPreSigned(_sigV[i], _sigR[i], _sigS[i], _to[i], _value[i], _fee[i], _nonce[i]);
        }
    }

    function transferPreSigned(uint8 _sigV, bytes32 _sigR, bytes32 _sigS, address _to, uint _value, uint _fee, uint _nonce) public {
        bytes32 txHash = keccak256(byte(0x19), byte(0), this, _to, _value, _fee, _nonce);
        address recovered = ecrecover(txHash, _sigV, _sigR, _sigS);
        require(recovered > 0x0);
        require(nonce[recovered] == _nonce);
        nonce[recovered]++;
        doTransfer(recovered, _to, _value);
        if(_fee > 0) {
            doTransfer(recovered, msg.sender, _fee);    
        }
    }
}