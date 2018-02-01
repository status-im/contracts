pragma solidity ^0.4.17;

import "./MiniMeToken.sol";

/**
 * @title MiniMeTokenPreSigned
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
    
    mapping (address => mapping(uint256 => bool)) public nonce;

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
        address recovered = recoverTransferPreSigned(_sigV, _sigR, _sigS, _to, _value, _gasPrice, _nonce);
        require(recovered > 0x0);
        if (nonce[recovered][_nonce]) {
            return;
        }
        nonce[recovered][_nonce] = true;
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
        address recovered = recoverApproveAndCallPreSigned(_sigV, _sigR, _sigS, _spender, _amount, _extraData, _gasPrice, _nonce);
        require(recovered > 0x0);

        if (nonce[recovered][_nonce]) {
            return;
        }
        nonce[recovered][_nonce] = true;

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
        if (_gasPrice > 0) {
            _gas = 21000 + _extraData.length + (_gas - msg.gas);
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
    function transferPreSignedArray(
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
    
    
    /**
     * @notice Gets txHash for using as Presigned Transaction
     * @param _to The address of the recipient
     * @param _value The amount of tokens to be transferred
     * @param _gasPrice How much tokens willing to pay per gas
     * @param _nonce Presigned transaction number.
     * @return txHash 'transferPreSigned(uint8,bytes32,bytes32,address,uint256,uint256,uint256)' hash
     */    
    function getTransferHash(
        address _to,
        uint256 _value,
        uint256 _gasPrice,
        uint256 _nonce
    )
        constant
        public
        returns(bytes32 txHash)
    {
        //"edde766e": "transferPreSigned(uint8,bytes32,bytes32,address,uint256,uint256,uint256)",
        txHash = keccak256(address(this), bytes4(0xedde766e), _to, _value, _gasPrice, _nonce);
    }
   
   
    /**
     * @notice get txHash of presigned `approveAndCallPreSigned(uint8,bytes32,bytes32,address,uint256,bytes,uint256,uint256)`
     * @param _spender The address of the recipient
     * @param _amount The amount of tokens to be transferred
     * @param _extraData option data to send to contract
     * @param _gasPrice How much tokens willing to pay per gas
     * @param _nonce Presigned transaction number.
     * @return txHash approveAndCallPreSigned(uint8,bytes32,bytes32,address,uint256,bytes,uint256,uint256) hash 
     */
    function getApproveAndCallHash(
        address _spender,
        uint256 _amount,
        bytes _extraData,
        uint256 _gasPrice,
        uint256 _nonce
    )
        constant
        public
        returns(bytes32 txHash)
    {
        //"c6a08009": "approveAndCallPreSigned(uint8,bytes32,bytes32,address,uint256,bytes,uint256,uint256)"
        txHash = keccak256(address(this), bytes4(0xc6a08009), _spender, _amount, _extraData, _gasPrice, _nonce);
    }

    /**
     * @notice Hash a hash with `"\x19Ethereum Signed Message:\n32"`
     * @param _hash Sign to hash.
     * @return signHash Hash to be signed.
     */
    function getSignHash(
        bytes32 _hash
    )
        constant
        public
        returns(bytes32 signHash)
    {
        signHash = keccak256("\x19Ethereum Signed Message:\n32", _hash);
    }
    

    /**
     * @notice Recover the address which signed a transfer
     * @param _sigV Signature V 
     * @param _sigR Signature R
     * @param _sigS Signature S
     * @param _to The address of the recipient
     * @param _value The amount of tokens to be transferred
     * @param _gasPrice How much tokens willing to pay per gas
     * @param _nonce Presigned transaction number.
     */
    function recoverTransferPreSigned(
        uint8 _sigV,
        bytes32 _sigR,
        bytes32 _sigS,
        address _to,
        uint256 _value,
        uint256 _gasPrice,
        uint256 _nonce
    ) 
        constant
        public 
        returns(address recovered)
    {
        recovered = ecrecover(getSignHash(getTransferHash(_to, _value, _gasPrice, _nonce)), _sigV, _sigR, _sigS);
    }

     /**
     * @notice recover the addres which signed an approveAndCal
     * @param _sigV Signature V 
     * @param _sigR Signature R
     * @param _sigS Signature S
     * @param _spender The address of the recipient
     * @param _amount The amount of tokens to be transferred
     * @param _extraData option data to send to contract
     * @param _gasPrice How much tokens willing to pay per gas
     * @param _nonce Presigned transaction number.
     */
    function recoverApproveAndCallPreSigned(
        uint8 _sigV,
        bytes32 _sigR,
        bytes32 _sigS,
        address _spender,
        uint256 _amount,
        bytes _extraData,
        uint256 _gasPrice,
        uint256 _nonce
    )
        constant
        public
        returns (address recovered)
    {
        recovered = ecrecover(getSignHash(getApproveAndCallHash(_spender, _amount, _extraData, _gasPrice, _nonce)), _sigV, _sigR, _sigS);
    }
}
