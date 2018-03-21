pragma solidity ^0.4.17;

import "./Identity.sol";
import "../token/ERC20Token.sol";

contract IdentityGasRelay is Identity {
    
    bytes4 public constant EXECUTE_PREFIX = bytes4(keccak256("executeGasRelayed(address,uint256,bytes32,uint256,uint256,address)"));

    event ExecutedGasRelayed(bytes32 signHash);

    function executeGasRelayed(
        address _to,
        uint256 _value,
        bytes _data,
        uint _nonce,
        uint _gasPrice,
        uint _gasMinimum, 
        address _gasToken,
        bytes _messageSignature
    ) 
        external
    {
        uint startGas = gasleft();
        require(startGas > _gasMinimum);
        uint256 requiredKey = _to == address(this) ? MANAGEMENT_KEY : ACTION_KEY;
        require(minimumApprovalsByKeyPurpose[requiredKey] == 1);
        require(_nonce == nonce);
        nonce++;
        
        bytes32 _signedHash = getSignHash(
            executeGasRelayedHash(
                _to,
                _value,
                keccak256(_data),
                _nonce,
                _gasPrice,
                _gasMinimum,
                _gasToken                
            )
        );

        require(
            isKeyPurpose(
                recoverKey(
                    _signedHash,
                    _messageSignature,
                    0
                ),
                requiredKey
            )
        );

        if (_to.call.value(_value)(_data)) {
            emit ExecutedGasRelayed(_signedHash);
        }

        if(_gasPrice > 0) {
            payInclusionFee(
                startGas - gasleft(),
                _gasPrice,
                msg.sender,
                _gasToken
            );
        }        
    }

    function executeGasRelayedMultiSigned(
        address _to,
        uint256 _value,
        bytes _data,
        uint _nonce,
        uint _gasPrice,
        uint _gasMinimum,
        address _gasToken, 
        bytes _messageSignatures
    ) 
        external 
    {
        uint startGas = gasleft();
        require(startGas > _gasMinimum);
        require(_nonce == nonce);
        nonce++;
        _executeGasRelayedMultiSigned(_to, _value, _data, _nonce, _gasPrice, _gasMinimum, _gasToken, _messageSignatures);
        if (_gasPrice > 0) {
            payInclusionFee(
                startGas - gasleft(),
                _gasPrice,
                msg.sender,
                _gasToken
            );
        }        
    }

    function executeGasRelayedHash(
        address _to,
        uint256 _value,
        bytes32 _dataHash,
        uint _nonce,
        uint256 _gasPrice,
        uint256 _gasMinimum,
        address _gasToken
    )
        public 
        view 
        returns (bytes32) 
    {
        return keccak256(
            address(this), 
            EXECUTE_PREFIX, 
            _to,
            _value,
            _dataHash,
            _nonce,
            _gasPrice,
            _gasMinimum,
            _gasToken
        );
    }

    function recoverKey (
        bytes32 _signHash, 
        bytes _messageSignature,
        uint256 _pos
    )
        pure
        public
        returns(bytes32) 
    {
        uint8 v;
        bytes32 r;
        bytes32 s;
        (v,r,s) = signatureSplit(_messageSignature, _pos);
        return bytes32(
            ecrecover(
                _signHash,
                v,
                r,
                s
            )
        );
    }

    /**
     * @dev divides bytes signature into `uint8 v, bytes32 r, bytes32 s` 
     */
    function signatureSplit(bytes _signature, uint256 _pos)
        pure
        public
        returns (uint8 v, bytes32 r, bytes32 s)
    {
        uint pos = _pos + 1;
        // The signature format is a compact form of:
        //   {bytes32 r}{bytes32 s}{uint8 v}
        // Compact means, uint8 is not padded to 32 bytes.
        assembly {
            r := mload(add(_signature, mul(32,pos)))
            s := mload(add(_signature, mul(64,pos)))
            // Here we are loading the last 32 bytes, including 31 bytes
            // of 's'. There is no 'mload8' to do this.
            //
            // 'byte' is not working due to the Solidity parser, so lets
            // use the second best option, 'and'
            v := and(mload(add(_signature, mul(65,pos))), 0xff)
        }

        require(v == 27 || v == 28);
    }
    
    /**
     * @notice Hash a hash with `"\x19Ethereum Signed Message:\n32"`
     * @param _hash Sign to hash.
     * @return signHash Hash to be signed.
     */
    function getSignHash(
        bytes32 _hash
    )
        pure
        public
        returns(bytes32 signHash)
    {
        signHash = keccak256("\x19Ethereum Signed Message:\n32", _hash);
    }

    
    function _executeGasRelayedMultiSigned(
        address _to,
        uint256 _value,
        bytes _data,
        uint _nonce,
        uint _gasPrice,
        uint _gasMinimum, 
        address _gasToken,
        bytes _messageSignatures
    ) 
        private 
    {
        uint256 requiredKey = _to == address(this) ? MANAGEMENT_KEY : ACTION_KEY;
        uint256 len = _messageSignatures.length / 72;
        require(len == minimumApprovalsByKeyPurpose[requiredKey]);

        bytes32 _signedHash = getSignHash(
            executeGasRelayedHash(
                _to,
                _value,
                keccak256(_data),
                _nonce,
                _gasPrice,
                _gasMinimum,
                _gasToken                
            )
        );

        bytes32 _lastKey = 0;
        for (uint256 i = 0; i < len; i++) {
            bytes32 _key = recoverKey(
                _signedHash,
                _messageSignatures,
                i
                );
            require(_key > _lastKey); //assert keys are different
            require(isKeyPurpose(_key, requiredKey));
            _lastKey = _key;
        }
        
        if (_to.call.value(_value)(_data)) {
            emit ExecutedGasRelayed(_signedHash);
        }
    }

    function payInclusionFee(
        uint256 _gasUsed,
        uint256 _gasPrice,
        address _msgIncluder,
        address _gasToken
    ) 
        private 
    {
        uint256 _amount = (21000 + _gasUsed) * _gasPrice;
        if (_gasToken == address(0)) {
            address(_msgIncluder).transfer(_amount);
        } else {
            ERC20Token(_gasToken).transfer(_msgIncluder, _amount);
        }
    }

}