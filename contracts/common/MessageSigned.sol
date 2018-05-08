pragma solidity ^0.4.21;

/** 
 * @notice Uses ethereum signed messages
 */
contract MessageSigned {
    
    constructor() internal {

    }

    /**
     * @notice recovers address who signed the message
     * @param _signHash operation ethereum signed message hash
     * @param _messageSignature message `_signHash` signature
     */
    function recoverAddress(
        bytes32 _signHash, 
        bytes _messageSignature
    )
        pure
        internal
        returns(address) 
    {
        uint8 v;
        bytes32 r;
        bytes32 s;
        (v,r,s) = signatureSplit(_messageSignature);
        return ecrecover(
            _signHash,
            v,
            r,
            s
        );
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
        internal
        returns (bytes32 signHash)
    {
        signHash = keccak256("\x19Ethereum Signed Message:\n32", _hash);
    }

    /**
     * @dev divides bytes signature into `uint8 v, bytes32 r, bytes32 s` 
     */
    function signatureSplit(bytes _signature)
        pure
        internal
        returns (uint8 v, bytes32 r, bytes32 s)
    {
        // The signature format is a compact form of:
        //   {bytes32 r}{bytes32 s}{uint8 v}
        // Compact means, uint8 is not padded to 32 bytes.
        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            // Here we are loading the last 32 bytes, including 31 bytes
            // of 's'. There is no 'mload8' to do this.
            //
            // 'byte' is not working due to the Solidity parser, so lets
            // use the second best option, 'and'
            v := and(mload(add(_signature, 65)), 0xff)
        }

        require(v == 27 || v == 28);
    }
    
}