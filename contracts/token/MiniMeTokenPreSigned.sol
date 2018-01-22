pragma solidity ^0.4.18;

import "./MiniMeToken.sol";

contract MiniMeTokenPreSigned is MiniMeToken {

    mapping (address => uint256) public nonce;
    
    function transferPreSigned(uint8[] _sigV, bytes32[] _sigR, bytes32[] _sigS, address[] _to, uint256[] _value, uint256[] _gasPrice, uint256[] _nonce) public {
        uint len = _sigR.length;
        require(len == _sigS.length && len == _sigV.length);
        for (uint i = 0; i < len; i++) {
            transferPreSigned(_sigV[i], _sigR[i], _sigS[i], _to[i], _value[i], _gasPrice[i], _nonce[i]);
        }
    }

    function approveAndCallPreSigned(uint8[] _sigV, bytes32[] _sigR, bytes32[] _sigS, address[] _spender, uint256[] _amount, bytes[] _extraData, uint256[] _gasPrice, uint256[] _nonce) public {
        uint len = _sigR.length;
        require(len == _sigS.length && len == _sigV.length);
        for (uint i = 0; i < len; i++) {
            approveAndCallPreSigned(_sigV[i], _sigR[i], _sigS[i], _spender[i], _amount[i], _extraData[i], _gasPrice[i], _nonce[i]);
        }
    }

    function transferPreSigned(uint8 _sigV, bytes32 _sigR, bytes32 _sigS, address _to, uint256 _value, uint256 _gasPrice, uint256 _nonce) public {
        uint256 _gas = msg.gas;
        //"a9059cbb": "transfer(address,uint256)",
        bytes32 txHash = keccak256(byte(0x19), byte(0), address(this), bytes4(0xa9059cbb), _to, _value, _gasPrice, _nonce);
        address recovered = ecrecover(txHash, _sigV, _sigR, _sigS);
        require(recovered > 0x0);
        require(nonce[recovered] == _nonce);
        nonce[recovered]++;
        doTransfer(recovered, _to, _value);
        _gas = 21000 + (_gas - msg.gas);
        if (_gasPrice > 0) {
            doTransfer(recovered, msg.sender, _gasPrice*_gas);    
        }
    }

    function approveAndCallPreSigned(uint8 _sigV, bytes32 _sigR, bytes32 _sigS, address _spender, uint256 _amount, bytes _extraData, uint256 _gasPrice, uint256 _nonce) public {
        uint256 _gas = msg.gas;
        require(transfersEnabled);
        //"cae9ca51": "approveAndCall(address,uint256,bytes)"
        bytes32 txHash = keccak256(byte(0x19), byte(0), address(this), bytes4(0xcae9ca51), _spender, _amount, _extraData, _gasPrice, _nonce);
        address recovered = ecrecover(txHash, _sigV, _sigR, _sigS);
        require(recovered > 0x0);
        require(nonce[recovered] == _nonce);
        nonce[recovered]++;

        require((_amount == 0) || (allowed[recovered][_spender] == 0));
        if (isContract(controller)) {
            require(TokenController(controller).onApprove(recovered, _spender, _amount));
        }
        allowed[recovered][_spender] = _amount;
        Approval(recovered, _spender, _amount);
        ApproveAndCallFallBack(_spender).receiveApproval(
            recovered,
            _amount,
            this,
            _extraData
        );
        _gas = 21000 + (_gas - msg.gas);
        if (_gasPrice > 0) {
            doTransfer(recovered, msg.sender, _gasPrice*_gas);    
        }
        
        
    }
}