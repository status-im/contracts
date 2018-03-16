pragma solidity ^0.4.17;

import "../token/ERC20Token.sol";


contract MessageDeliveryPayout {

    ERC20Token SNT;
    mapping(bytes32 => bool) delivered;

    event Delivered(address indexed sender, bytes32 message);

    function MessageDeliveryPayout(ERC20Token _snt) public {
        SNT = _snt;
    }

    /**
     * @notice confirms delivery of message and payouts to whoever delivered the message
     * @notice `_sender` needs to approve against this contract, check _sender `SNT` token approval before trying to confirm;
     * @param _sender the address of message sender
     * @param _receiver the address of message destination
     * @param _message the hash of the message
     * @param _deliveryFee the amount willing to pay to deliver the message
     * @param _senderSignature signature of contract address, message receiver, message hash, the node that contains the message and the delivery fee by `_sender`
     * @param _receiverSignature signature of contract adress, message hash
     */
    function confirmDelivery(address _sender, address _receiver, bytes32 _message, uint256 _deliveryFee, bytes _senderSignature, bytes _receiverSignature) public {
        require(!delivered[_message]);
        var (v,r,s) = signatureSplit(_senderSignature);
        require(ecrecover(getSignedHash(keccak256(address(this), _receiver, _message, address(msg.sender), _deliveryFee)), v,r,s) == address(_sender));
        (v,r,s) = signatureSplit(_receiverSignature);
        require(ecrecover(getSignedHash(keccak256(address(this), _message)), v,r,s) == address(_receiver));
        SNT.transferFrom(_sender, msg.sender, _deliveryFee);
        delivered[_message] = true;
        Delivered(_sender, _message);
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