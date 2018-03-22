pragma solidity ^0.4.17;

import "./Identity.sol";
import "../token/ERC20Token.sol";

/**
 * @title IdentityGasRelay
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @notice enables economic abstraction for Identity
 */
contract IdentityGasRelay is Identity {
    
    bytes4 public constant CALL_PREFIX = bytes4(keccak256("callGasRelayed(address,uint256,bytes32,uint256,uint256,address)"));

    event ExecutedGasRelayed(bytes32 signHash);

    /**
     * @notice include ethereum signed callHash in return of gas proportional amount multiplied by `_gasPrice` of `_gasToken`
     *         allows identity of being controlled without requiring ether in key balace
     * @param _to destination of call
     * @param _value call value (ether)
     * @param _data call data
     * @param _nonce current identity nonce
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasMinimal minimal amount of gas needed to complete the execution
     * @param _gasToken token being used for paying `msg.sender`
     * @param _messageSignature rsv concatenated ethereum signed message signature
     */
    function callGasRelayed(
        address _to,
        uint256 _value,
        bytes _data,
        uint _nonce,
        uint _gasPrice,
        uint _gasMinimal, 
        address _gasToken,
        bytes _messageSignature
    ) 
        external
    {
        uint startGas = gasleft();
        require(startGas >= _gasMinimal);
        uint256 requiredKey = _to == address(this) ? MANAGEMENT_KEY : ACTION_KEY;
        require(minimumApprovalsByKeyPurpose[requiredKey] == 1);
        require(_nonce == nonce);
        nonce++;
        
        bytes32 _signedHash = getSignHash(
            callGasRelayedHash(
                _to,
                _value,
                keccak256(_data),
                _nonce,
                _gasPrice,
                _gasMinimal,
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

    /**
    * @notice include ethereum signed callHash in return of gas proportional amount multiplied by `_gasPrice` of `_gasToken`
     *         allows identity of being controlled without requiring ether in key balace
     * @param _to destination of call
     * @param _value call value (ether)
     * @param _data call data
     * @param _nonce current identity nonce
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasMinimal minimal amount of gas needed to complete the execution
     * @param _gasToken token being used for paying `msg.sender`
     * @param _messageSignatures rsv concatenated ethereum signed message signatures
     */
    function callGasRelayedMultiSigned(
        address _to,
        uint256 _value,
        bytes _data,
        uint _nonce,
        uint _gasPrice,
        uint _gasMinimal,
        address _gasToken, 
        bytes _messageSignatures
    ) 
        external 
    {
        uint startGas = gasleft();
        require(startGas >= _gasMinimal);
        require(_nonce == nonce);
        nonce++;
        _callGasRelayedMultiSigned(_to, _value, _data, _nonce, _gasPrice, _gasMinimal, _gasToken, _messageSignatures);
        if (_gasPrice > 0) {
            payInclusionFee(
                startGas - gasleft(),
                _gasPrice,
                msg.sender,
                _gasToken
            );
        }        
    }

    /**
     * @notice get callHash
     * @param _to destination of call
     * @param _value call value (ether)
     * @param _data call data
     * @param _nonce current identity nonce
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasMinimal minimal amount of gas needed to complete the execution
     * @param _gasToken token being used for paying `msg.sender` 
     */
    function callGasRelayedHash(
        address _to,
        uint256 _value,
        bytes32 _dataHash,
        uint _nonce,
        uint256 _gasPrice,
        uint256 _gasMinimal,
        address _gasToken
    )
        public 
        view 
        returns (bytes32 callHash) 
    {
        callHash = keccak256(
            address(this), 
            CALL_PREFIX, 
            _to,
            _value,
            _dataHash,
            _nonce,
            _gasPrice,
            _gasMinimal,
            _gasToken
        );
    }
    /**
     * @notice recovers address who signed the message 
     * @param _signHash operation ethereum signed message hash
     * @param _messageSignature message `_signHash` signature
     * @param _pos which signature to read
     */
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
     * @param _pos which signature to read
     * @param _signatures concatenated vrs signatures
     */
    function signatureSplit(bytes _signatures, uint256 _pos)
        pure
        public
        returns (uint8 v, bytes32 r, bytes32 s)
    {
        uint pos = _pos + 1;
        // The signature format is a compact form of:
        //   {bytes32 r}{bytes32 s}{uint8 v}
        // Compact means, uint8 is not padded to 32 bytes.
        assembly {
            r := mload(add(_signatures, mul(32,pos)))
            s := mload(add(_signatures, mul(64,pos)))
            // Here we are loading the last 32 bytes, including 31 bytes
            // of 's'. There is no 'mload8' to do this.
            //
            // 'byte' is not working due to the Solidity parser, so lets
            // use the second best option, 'and'
            v := and(mload(add(_signatures, mul(65,pos))), 0xff)
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

    /**
     * @dev needed function to avoid "too much variables, stack too deep"
     */    
    function _callGasRelayedMultiSigned(
        address _to,
        uint256 _value,
        bytes _data,
        uint _nonce,
        uint _gasPrice,
        uint _gasMinimal, 
        address _gasToken,
        bytes _messageSignatures
    ) 
        private 
    {
        uint256 requiredKey = _to == address(this) ? MANAGEMENT_KEY : ACTION_KEY;
        uint256 len = _messageSignatures.length / 72;
        require(len == minimumApprovalsByKeyPurpose[requiredKey]);

        bytes32 _signedHash = getSignHash(
            callGasRelayedHash(
                _to,
                _value,
                keccak256(_data),
                _nonce,
                _gasPrice,
                _gasMinimal,
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

    /**
     * @dev performs the gas payment in the selected token
     * @param _gasUsed the amount of gas used
     * @param _gasPrice selected gas price
     * @param _msgIncluder address who included the message
     * @param _gasToken ERC20Token to transfer, or if 0x0 uses ether in balance.
     */
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