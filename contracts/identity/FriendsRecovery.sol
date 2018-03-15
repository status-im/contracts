pragma solidity ^0.4.17;

contract FriendsRecovery {
    
    address private identity;
    bytes32 private secret;
    uint256 private threshold;
    uint256 private setupDelay;
    mapping(bytes32 => bool) private friendAllowed;
    mapping(bytes32 => bool) private revealed;
    mapping(bytes32 => mapping(address => bool)) private signed;
    NewRecovery private pendingSetup;

    struct NewRecovery {
        uint256 addition;
        bytes32 secret;
        uint256 threshold;
        uint256 setupDelay;
        bytes32[] friends;
    }

    event SetupRequested(uint256 activation);
    event Activated();
    event Approved(bytes32 indexed secretHash, address approver);
    event Execution(bool success);

    modifier identityOnly() {
        require(msg.sender == identity);
        _;
    }
    modifier notRevealed(bytes32 secretHash) {
        require(!revealed[secretHash]);
        _;
    }

    function FriendsRecovery(
        address _identity,
        uint256 _setupDelay,
        uint256 _threshold,
        bytes32 _secret,
        bytes32[] _friendHashes
        ) 
        public 
    {
        identity = _identity;
        threshold = _threshold;
        secret = _secret;
        setupDelay = _setupDelay;
        addFriends(_friendHashes);
    }

    function withdraw() 
        external
        identityOnly
    {
        identity.transfer(this.balance);
    }

    function cancelSetup() 
        external 
        identityOnly 
    {
        delete pendingSetup;
        SetupRequested(0);
    }

    function setup(
        bytes32 _newSecret,
        uint256 _setupDelay,
        uint256 _threshold,
        bytes32[] _newFriendsHashes
        )
        external 
        identityOnly
        notRevealed(_newSecret)
    {
        pendingSetup.addition = block.timestamp;
        pendingSetup.secret = _newSecret;
        pendingSetup.friends = _newFriendsHashes;
        pendingSetup.threshold = _threshold;
        pendingSetup.setupDelay = _setupDelay;
        SetupRequested(block.timestamp + setupDelay);
    }

    function activate()
        external
    {
        require(pendingSetup.addition > 0);
        require(pendingSetup.addition + setupDelay <= block.timestamp);
        threshold = pendingSetup.threshold;
        setupDelay = pendingSetup.setupDelay;
        secret = pendingSetup.secret;
        addFriends(pendingSetup.friends);
        delete pendingSetup;
        Activated();
    }

    function approve(bytes32 _secretHash) 
        external 
    {
        require(!signed[_secretHash][msg.sender]);
        signed[_secretHash][msg.sender] = true;
        Approved(_secretHash, msg.sender);
    }

    function approvePreSigned(bytes32 _secretHash, uint8[] _v, bytes32[] _r, bytes32[] _s) 
        external 
    {
        uint256 len = _v.length;
        require (_r.length == len);
        require (_s.length == len);    
        require (_v.length == len);    
        bytes32 signatureHash = getSignHash(_secretHash); 
        for (uint256 i = 0; i < len; i++) {
            address recovered = ecrecover(signatureHash, _v[i], _r[i], _s[i]);
            require(!signed[_secretHash][recovered]);
            require(recovered != address(0));
            signed[_secretHash][recovered] = true;
            Approved(_secretHash, recovered);
        }        
    }

    function execute(
        bytes32 _revealedSecret,
        address _dest,
        bytes _data,
        address[] _friendList,
        bytes32 _newSecret,
        bytes32[] _newFriendsHashes
        ) 
        external 
        notRevealed(_newSecret)
    {
        require(_friendList.length >= threshold);
        require(keccak256(identity, _revealedSecret) == secret);
        revealed[_newSecret] = true;
        bytes32 _secretHash = keccak256(identity, _revealedSecret, _dest, _data, _newSecret, _newFriendsHashes);
        
        for (uint256 i = 0; i < threshold; i++) {
            address friend = _friendList[i];
            require(friend != address(0));
            require(friendAllowed[keccak256(identity, _revealedSecret, friend)]);
            require(signed[_secretHash][friend]);
            delete signed[_secretHash][friend];
        }

        secret = _newSecret;
        addFriends(_newFriendsHashes);

        Execution(_dest.call(_data));
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