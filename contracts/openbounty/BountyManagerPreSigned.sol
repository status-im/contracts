pragma solidity ^0.4.17;

import "./BountyManager.sol";

contract BountyManagerPreSigned is BountyManager { 

    mapping(address => uint256) presignNonce;
    address public trustedToken;
    

    function BountyManagerPreSigned(address _factory, address[] _owners) 
        BountyManager(_factory, _owners)
        public
    {
    
    }

    ///////
    /// Token proxied calls

    /**
     *
     */
    function receiveApproval(address _from, uint256 _amount, address _token, bytes _data) external {
        require(_token == trustedToken); //token address must be trusted
        require(msg.sender == _token); //msg.sender must be the token contract itself
        require(_amount == 0); //not accept token deposits
        gasProxiedCall(_from, _data); 
    }
    

    function callPreSigned(bytes _signature, bytes _data, uint256 _nonce) external {
        address recovered = recoverCallPreSigned(_signature, _data, _nonce);
        require(recovered != address(0));
        require(presignNonce[recovered] == _nonce);
        presignNonce[recovered]++;
        gasProxiedCall(recovered, _data);
    }

     /**
      * 
      * @dev Proxy the calls for Presigned messages or TrustedToken gas paid messages
      *      newBounty(uint)
      *      increaseRewardBounty(address,uint256)
      *      decreaseRewardBounty(address,uint256)
      *      closeBounty(address)
      *      submitTransaction(address,uint256,bytes)
      *      confirmTransaction(uint256)
      *      executeTransaction(uint256)
     */
    function gasProxiedCall(address _from, bytes _data) private {
         // {size}{4bytes method}{position 32 bytes}[{lenght 32 bytes}{signature data}]
        uint datasize = _data.length;
        require(datasize > 4); // data must be at least 4 bytes for reading the call method
        bytes4 calling; 
        assembly {
            calling := mload(add(_data, 4))
        }
        
        if (calling == method("newBounty(uint)")) {
            _newBounty(_from, datasize, _data);
        } else if (calling == method("increaseRewardBounty(address,uint256)")) {
            _increaseRewardBounty(_from, datasize, _data);
        } else if (calling == method("decreaseRewardBounty(address,uint256)")) {
            _decreaseRewardBounty(_from, datasize, _data);
        } else if (calling == method("closeBounty(address)")) {
            _closeBounty(_from, datasize, _data);
        } else if (calling == method("submitTransaction(address,uint256,bytes)")) {
            _submitTransaction(_from, datasize, _data);
        } else if (calling == method("confirmTransaction(uint256)")) {
            _confirmTransaction(_from, datasize, _data);
        } else if (calling == method("executeTransaction(uint256)")) {
            _executeTransaction(datasize, _data);
        } else {
            revert();
        }
    }

    /**
     * @dev process the proxied call
     */
    function _newBounty(address _from, uint256 datasize, bytes _data) private {
        require(datasize == 36);//this method require exact size 36 on _data
        uint256 timeout;
        assembly {
            timeout := mload(add(_data, 36))
        }
        newBounty(_from, timeout);
    }

    
    /**
     * @dev process the proxied call
     */
    function _increaseRewardBounty(address _from, uint256 datasize, bytes _data) private {
        require(datasize == 36);//this method require exact size 36 on _data
        address instance;
        address destination;
        uint256 amount;
        
        assembly {
            instance := mload(add(_data, 36))
            amount := mload(add(_data, 68))
        }
        increaseRewardBounty(_from, instance, destination, amount);
    }
    
    /**
     * @dev process the proxied call
     */
    function _decreaseRewardBounty(address _from, uint256 datasize, bytes _data) private {
        require(datasize == 36);//this method require exact size 36 on _data
        address instance;
        address destination;
        uint256 amount;
        assembly {
            instance := mload(add(_data, 36))
            amount := mload(add(_data, 68))
        }
        decreaseRewardBounty(_from, instance, destination, amount);
    }
    
    /**
     * @dev process the proxied call
     */
    function _closeBounty(address _from, uint256 datasize, bytes _data) private {
        require(datasize == 36);//this method require exact size 36 on _data
        address instance;
        assembly {
            instance := mload(add(_data, 36))
        }
        closeBounty(_from, instance);
    }

    /**
     * @dev process the proxied call
     */
    function _submitTransaction(address _from, uint256 datasize, bytes _data) private {
        require(datasize > 100); //must contain at least array size and pos
        address callDestination;
        uint256 callValue;
        bytes memory callData;
        assembly {
            callDestination := mload(add(_data, 36))
            callValue := mload(add(_data, 68))
            callData := mload(add(_data, 100))
        }
        submitTransaction(_from, callDestination, callValue, callData);
    }

    /**
     * @dev process the proxied call
     */
    function _confirmTransaction(address _from, uint256 datasize, bytes _data) private {
        require(datasize == 36); //each additional parameter add 32 
        uint256 transactionId;
        assembly {
            transactionId := mload(add(_data, 36))
        }
        confirmTransaction(_from, transactionId);
    }

    /**
     * @dev process the proxied call
     */
    function _executeTransaction(uint256 datasize, bytes _data) private {
        require(datasize == 36); //each additional parameter add 32 
        uint256 transactionId;
        assembly {
            transactionId := mload(add(_data, 36))
        }
        executeTransaction(transactionId);
    }

    

    /**
     *
     */
    function method(string s)
        private
        pure
        returns(bytes4)
    {
        return bytes4(keccak256(s));
    }

    /**
     * @notice get txHash of presigned `approve(address,uint256)`
     * @param _data Presigned data
     * @param _nonce Presigned transaction number.
     * @return txHash Presigned `approve(address,uint256)` Hash
     */
    function getCallHash(
        bytes _data,
        uint256 _nonce
    )
        constant
        public
        returns(bytes32 txHash)
    {
        //"095ea7b3": "approve(address,uint256)",
        txHash = keccak256(address(this), _data, _nonce);
    }

      /**
     * @notice recover the address which signed an approve
     * @param signature
     * @param _data
     * @param _nonce Presigned transaction number.
     */
    function recoverCallPreSigned(
        bytes signature,
        bytes _data,
        uint256 _nonce
    )
        constant
        public
        returns (address recovered)
    {
        var (_sigV, _sigR, _sigS) = signatureSplit(signature);
        recovered = ecrecover(getSignedHash(getCallHash(_data, _nonce)), _sigV, _sigR, _sigS);
    }

    /**
     * @notice Hash a hash with `"\x19Ethereum Signed Message:\n32"`
     * @param _hash Sign to hash.
     * @return signHash Hash to be signed.
     */
    function getSignedHash(
        bytes32 _hash
    )
        pure
        public
        returns(bytes32 signHash)
    {
        signHash = keccak256("\x19Ethereum Signed Message:\n32", _hash);
    }

    /**
     * @dev divides bytes signature into `uint8 v, bytes32 r, bytes32 s` 
     */
    function signatureSplit(bytes signature)
        pure
        private
        returns (uint8 v, bytes32 r, bytes32 s)
    {
        // The signature format is a compact form of:
        //   {bytes32 r}{bytes32 s}{uint8 v}
        // Compact means, uint8 is not padded to 32 bytes.
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            // Here we are loading the last 32 bytes, including 31 bytes
            // of 's'. There is no 'mload8' to do this.
            //
            // 'byte' is not working due to the Solidity parser, so lets
            // use the second best option, 'and'
            v := and(mload(add(signature, 65)), 0xff)
        }

        require(v == 27 || v == 28);
    }

}