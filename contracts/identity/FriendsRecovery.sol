pragma solidity ^0.4.17;


contract FriendsRecovery {
    address private controller;
    bytes32 private secret;
    mapping(bytes32 => bool) friendAllowed;
    uint threshold;
    uint nonce;
    mapping (uint256 => Recovering) recoveryAttempt; 

    struct Recovering {
        uint8[] v;
        bytes32[] r;
        address newOwner;
    }

    event RecoveryCompleted(address newController);

    function FriendsRecovery( uint256 _threshold, bytes32 _secret, bytes32[] _friendHashes) public {
        threshold = _threshold;
        secret = _secret;
        uint len = _friendHashes.length;
        require(threshold <= len);
        for (uint i = 0; i < len; i++) {
            friendAllowed[_friendHashes[i]] = true;
        }

    }

    function execute(address _identity, bytes _data) external {
        require(msg.sender == controller);
        _identity.call(_data);
    }

    function recover(address _newOwner, uint8[] _v, bytes32[] _r) 
        external 
        returns (uint nonce)
    {
        require (_v.length >= threshold);
        require (_r.length >= threshold);
        nonce++;
        recoveryAttempt[nonce] = Recovering({v: _v, r: _r, newOwner: _newOwner});
    }

    function reveal(uint256 _nonce, bytes32 _secret, 
        bytes32 _newSecret, bytes32[] _s, address[] _friendList, bytes32[] _newFriendsHashes) external {
        require(_s.length >= threshold);
        require(_friendList.length >= threshold);
        bytes32 _secretHash = keccak256(_secret);
        require(_secretHash == secret);
       
        Recovering memory attempt = recoveryAttempt[_nonce];
        bytes32 signatureHash = getSignHash(keccak256(address(this), keccak256(_secretHash, attempt.newOwner)));  
       
        for (uint256 i = 0; i < threshold; i++) {
            friendSigned(_secret, _friendList[i], attempt.v[i], attempt.r[i], _s[i], signatureHash);
        }
        controller = attempt.newOwner;
        secret = _newSecret;
        addFriends(_newFriendsHashes);
        delete recoveryAttempt[_nonce];
        RecoveryCompleted(controller);
    }
   
    function friendSigned(bytes32 _secret, address _friend, uint8 _v, bytes32 _r, bytes32 _s, bytes32 _messageHash) private {
            require(ecrecover(_messageHash, _v, _r, _s) == _friend); 
            bytes32 friendHash = keccak256(_friend, _secret);
            require(friendAllowed[friendHash]);
            delete friendAllowed[friendHash];
    }

    function addFriends(bytes32[] _newFriendsHashes) private {
        uint256 len = _newFriendsHashes.length;
        require(len >= threshold);
        for (uint256 i = 0; i < len; i++) {
            friendAllowed[_newFriendsHashes[i]] = true;
        }
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

   
}