pragma solidity ^0.4.17;


contract FriendsRecovery {
    
    address private controller;
    bytes32 private secret;
    mapping(bytes32 => bool) friendAllowed;
    uint threshold;
    uint nonce; 
    mapping(bytes32 => mapping(address => bool)) signed;

    event RecoveryCompleted(address newController);

    function FriendsRecovery( uint256 _threshold, bytes32 _secret, bytes32[] _friendHashes) public {
        threshold = _threshold;
        secret = _secret;
        addFriends(_friendHashes);
    }

    function execute(address _identity, bytes _data) external {
        require(msg.sender == controller);
        require(_identity.call(_data));
    }

    function approve(bytes32 _secretHash) 
        external 
    {
        signed[_secretHash][msg.sender] = true;
    }

    function approvePreSigned(bytes32 _secretHash, uint8[] _v, bytes32[] _r, bytes32[] _s) 
        external 
    {
        uint256 len = _v.length;
        require (len >= threshold);
        require (_r.length == len);
        require (_s.length == len);    
        bytes32 signatureHash = getSignHash(keccak256(address(this), _secretHash)); 
        for (uint256 i = 0; i < len; i++){
            address recovered = ecrecover(signatureHash, _v[i], _r[i], _s[i]);
            require(recovered != address(0));
            signed[_secretHash][recovered] = true;
        }        
    }

    function reveal(bytes32 _secret, address _newOwner, address[] _friendList, bytes32 _newSecret, bytes32[] _newFriendsHashes) external {
        require(_friendList.length >= threshold);
        require(keccak256(_secret) == secret);
        bytes32 _secretHash = keccak256(_secret, _newOwner);
        
        for (uint256 i = 0; i < threshold; i++) {
            address friend = _friendList[i];
            require(friendAllowed[keccak256(_secret, friend)]);
            require(signed[_secretHash][friend]);
            delete signed[_secretHash][friend];
        }

        controller = _newOwner;
        secret = _newSecret;
        addFriends(_newFriendsHashes);
        RecoveryCompleted(controller);
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