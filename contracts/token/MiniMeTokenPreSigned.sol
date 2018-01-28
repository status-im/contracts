pragma solidity ^0.4.18;

import "./MiniMeToken.sol";

/**
 * @title StatusConstitution
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @dev MiniMeToken that supports pre-signed methods transfer(address,uint256) and approveAndCall(address,uint256,bytes)
 */
contract MiniMeTokenPreSigned is MiniMeToken {

    function MiniMeTokenPreSigned(
        address _tokenFactory,
        address _parentToken,
        uint _parentSnapShotBlock,
        string _tokenName,
        uint8 _decimalUnits,
        string _tokenSymbol,
        bool _transfersEnabled
    ) MiniMeToken(
        _tokenFactory,
         _parentToken,
         _parentSnapShotBlock,
         _tokenName,
         _decimalUnits,
         _tokenSymbol,
        _transfersEnabled
    ) 
        public 
    {     
    
    }
    
    mapping (address => uint256) public nonce;
    
    /**
     * @notice Include a presigned `transfer(address,uint256)`
     * @param _sigV Signature V 
     * @param _sigR Signature R
     * @param _sigS Signature S
     * @param _to The address of the recipient
     * @param _value The amount of tokens to be transferred
     * @param _gasPrice How much tokens willing to pay per gas
     * @param _nonce Presigned transaction number.
     */
    function transferPreSigned(
        uint8 _sigV,
        bytes32 _sigR,
        bytes32 _sigS,
        address _to,
        uint256 _value,
        uint256 _gasPrice,
        uint256 _nonce
    ) 
        public 
    {
        uint256 _gas = msg.gas;
        //"a9059cbb": "transfer(address,uint256)",
        bytes32 txHash = keccak256(address(this), bytes4(0xa9059cbb), _to, _value, _gasPrice, _nonce);
        bytes32 signedMsg = keccak256("\x19Ethereum Signed Message:\n32", txHash);
        address recovered = ecrecover(signedMsg, _sigV, _sigR, _sigS);
        require(recovered > 0x0);
        require(nonce[recovered] == _nonce);
        nonce[recovered]++;
        require(doTransfer(recovered, _to, _value));
        _gas = 21000 + (_gas - msg.gas);
        if (_gasPrice > 0) {
            require(doTransfer(recovered, msg.sender, _gasPrice * _gas));    
        }
    }

    /**
     * @notice Include a presigned `approveAndCall(address,uint256,bytes)`
     * @param _sigV Signature V 
     * @param _sigR Signature R
     * @param _sigS Signature S
     * @param _spender The address of the recipient
     * @param _amount The amount of tokens to be transferred
     * @param _extraData option data to send to contract
     * @param _gasPrice How much tokens willing to pay per gas
     * @param _nonce Presigned transaction number.
     */
    function approveAndCallPreSigned(
        uint8 _sigV,
        bytes32 _sigR,
        bytes32 _sigS,
        address _spender,
        uint256 _amount,
        bytes _extraData,
        uint256 _gasPrice,
        uint256 _nonce
    )
        public
    {
        uint256 _gas = msg.gas;
        require(transfersEnabled);
        //"cae9ca51": "approveAndCall(address,uint256,bytes)"
        bytes32 txHash = keccak256(address(this), bytes4(0xcae9ca51), _spender, _amount, _extraData, _gasPrice, _nonce);
        bytes32 signedMsg = keccak256("\x19Ethereum Signed Message:\n32", txHash);
        address recovered = ecrecover(signedMsg, _sigV, _sigR, _sigS);
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
            require(doTransfer(recovered, msg.sender, _gasPrice*_gas));    
        }
            
    }

    /**
     * @notice Include batches of presigned `transfer(address,uint256)`
     * @param _sigV Signature V 
     * @param _sigR Signature R
     * @param _sigS Signature S
     * @param _to The address of the recipient
     * @param _value The amount of tokens to be transferred
     * @param _gasPrice How much tokens willing to pay per gas
     * @param _nonce Presigned transaction number.
     */
    function transferPreSigned(
        uint8[] _sigV,
        bytes32[] _sigR,
        bytes32[] _sigS,
        address[] _to,
        uint256[] _value,
        uint256[] _gasPrice,
        uint256[] _nonce
    )
        public 
    {
        uint len = _sigR.length;
        require(len == _sigS.length && len == _sigV.length);
        for (uint i = 0; i < len; i++) {
            transferPreSigned(_sigV[i], _sigR[i], _sigS[i], _to[i], _value[i], _gasPrice[i], _nonce[i]);
        }
    }
    
}