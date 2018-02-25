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

    function FriendsRecovery( uint256 _threshold, bytes32[] _friendHashes) public {
        threshold = _threshold;
        uint len = _friendHashes.length;
        require(len < threshold);
        for (uint i = 0; i < len; i++) {
            friendAllowed[_friendHashes[i]] = true;
        }

    }

    function execute(address _identity, bytes _data) external {
        require(msg.sender == controller);
        _identity.call(_data);
    }

    function recover(address _newOwner, uint8[] _v, bytes32[] _r) external {
        require (_v.length > threshold);
        require (_r.length > threshold);
        recoveryAttempt[nonce] = Recovering({v: _v, r: _r, newOwner: _newOwner});
    }

    function reveal(uint256 _nonce, bytes32 _secret, bytes32 _newSecret, bytes32[] _s, address[] _friendList, bytes32[] _newFriendsHashes) external {
        require(_s.length >= threshold);
        require(_friendList.length >= threshold);
        bytes32 _secretHash = keccak256(_secret);
        require(_secretHash == secret);
        Recovering storage attempt = recoveryAttempt[_nonce];
        bytes32 signatureHash = getSignHash(hashNewOwnerSecret(keccak256(_secretHash), attempt.newOwner));
        
        for (uint256 i = 0; i < threshold; i++) {
            address friend = _friendList[i];
            require(ecrecover(signatureHash, attempt.v[i], attempt.r[i], _s[i]) == friend); 
            bytes32 friendHash = keccak256(friend, _secret);
            require(friendAllowed[friendHash]);
            delete friendAllowed[friendHash];
        }
        controller = attempt.newOwner;
        secret = _newSecret;
        uint256 len = _newFriendsHashes.length;
        require(len >= threshold);
        for (i = 0; i < len; i++) {
            friendAllowed[_newFriendsHashes[i]] = true;
        }
        RecoveryCompleted(controller);
    }


    function hashNewOwnerSecret(bytes32 _secretHash, address _newOwner) public constant returns(bytes32 _hash) {
        _hash = keccak256(address(this), _secretHash, _newOwner);
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