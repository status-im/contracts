pragma solidity ^0.4.17;

import "../common/MessageSigned.sol";

/**
 * @notice Select privately other accounts that will allow the execution of actions
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 */
contract FriendsRecovery is MessageSigned {
    
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

    /**
     * @notice Contructor of FriendsRecovery
     * @param _identity Controller of this contract
     * @param _setupDelay Delay for changes being active
     * @param _threshold Amount of approvals required
     * @param _secret Double hash of User Secret
     * @param _friendHashes Friends addresses hashed with single hash of User Secret
     **/
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

    /**
     * @notice Withdraw funds sent incorrectly to this contract
     */
    function withdraw() 
        external
        identityOnly
    {
        identity.transfer(address(this).balance);
    }

    /** 
     * @notice Cancels a pending setup to change the recovery parameters
     */
    function cancelSetup() 
        external 
        identityOnly 
    {
        delete pendingSetup;
        emit SetupRequested(0);
    }

    /**
     * @notice reconfigure recovery parameters
     * @param _newSecret Double hash of User Secret
     * @param _setupDelay Delay for changes being active
     * @param _threshold Amount of approvals required
     * @param _newFriendsHashes Friends addresses hashed with single hash of User Secret
     */
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
        emit SetupRequested(block.timestamp + setupDelay);
    }

    /**
     * @notice Activate a pending setup of recovery parameters
     */
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
        emit Activated();
    }

    /**
     * @notice Approves a recovery
     * @param _secretHash Hash of the transaction
     */
    function approve(bytes32 _secretHash) 
        external 
    {
        require(!signed[_secretHash][msg.sender]);
        signed[_secretHash][msg.sender] = true;
        emit Approved(_secretHash, msg.sender);
    }

    /**
     * @notice Approve a recovery using an ethereum signed message
     * @param _secretHash Hash of the transaction
     * @param _v signatures v
     * @param _r signatures r
     * @param _s signatures s
     */
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
            emit Approved(_secretHash, recovered);
        }        
    }

    /**
     * @notice executes an approved transaction revaling secret hash, friends addresses and set new recovery parameters
     * @param _revealedSecret Single hash of User Secret
     * @param _dest Address will be called
     * @param _data Data to be sent
     * @param _friendList friends addresses that approved
     * @param _newSecret new recovery double hashed user secret
     * @param _newFriendsHashes new friends list hashed with new recovery secret hash
     */
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

        emit Execution(_dest.call(_data));
    }

    /**
     * @dev add friends to recovery parameters
     */
    function addFriends(bytes32[] _newFriendsHashes) private {
        uint256 len = _newFriendsHashes.length;
        require(len >= threshold);
        for (uint256 i = 0; i < len; i++) {
            friendAllowed[_newFriendsHashes[i]] = true;
        }
    }
   
}