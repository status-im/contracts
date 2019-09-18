pragma solidity ^0.5.1;

import "../cryptography/MerkleProof.sol";
import "../cryptography/ECDSA.sol";
import "../token/ERC20Token.sol";

/**
 * @notice Select privately other accounts that will allow the execution of actions
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 */
contract MultisigRecovery {

    /**
     * Controller of Recovery
     */
    address private identity;

    /** # User Secret Data Hash
     * Hash of Semi-private information, such as a "randomly ordered personal information + secret answer", or a hash of user biometric data.
     * The secret should only be revaled together with `execute`, which requires changing the secret at every execution.
     * Contract is configured with a hash of a hash of this personal data hash. `keccak256(keccak256(userDataHash)).
     * If case of using personal information, a form containing several fields of optional data, where, must be written only things that you can always know, but is not completely or usually public.
     * Some of this fields would be used to create tthe user data hash, when recovering user would have to enter the same fields again and automatically will try all combinations with that data until find whats used for the secret.
     * Example of an userDataHash: keccak256("Alice Pleasance Liddell;1852-04-04;Lorina Hanna Liddell;England;Name of important childhood friend?Dodgson")
     * If case of user biometric data, most of sensors should be able to give more then one result for the same repetable reading for the same finger, or just a part of it is used.
     * When revealed, a different secret is needed, then another of that results from the biometric sensor.
     */
    bytes32 public userDataHash;

    /** # Secret Theshold Hash
     * A hash of threshold (number of allowances needed to execute) hashed together with the "User Secret Data Hash"
     * Example: `keccak256(userDataHash, threshold)`
     * Theshold number is revealed in execute, together with the "Secret User Data Hash" and its verified against what is configured in contract.
     * Threshold can be easily figured out if the Secret User Data Hash is known.
     */
    bytes32 public secretThesholdHash;

    /** # Secret Addresses Merkle Root
     * Each address is hashed against a hash of "User Secret Data Hash" (`kecakk256(keccak256(userDataHash), friendAddress)` and a merkle tree is build in top of the dataset.
     * Addresses in this merkle tree would be able to approve a call for anything if they know the Hash of the "User Secret Data Hash".
     */
    bytes32 public friendsMerkleRoot;

    /** # Setup Delay
     * Amount of time delay needed to activate a new recovery setup
     */
    uint256 public setupDelay;

    //flag for used recoveries (user need to define a different userDataHash every execute)
    mapping(bytes32 => bool) private revealed;
    //flag to prevent resigning
    mapping(bytes32 => mapping(address => bool)) private signed;
    //storage for pending delayed setup
    NewRecovery private pendingSetup;

    struct NewRecovery {
        uint256 timestamp;
        bytes32 userDataHash;
        bytes32 secretThesholdHash;
        bytes32 friendsMerkleRoot;
        uint256 setupDelay;
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
     * @param _userDataHash Double hash of User Secret
     * @param _secretThresholdHash Secret Amount of approvals required
     * @param _friendsMerkleRoot Merkle root of new secret friends list
     * @param _setupDelay Delay for changes being active
     **/
    constructor(
        address _identity,
        bytes32 _secretThresholdHash,
        bytes32 _userDataHash,
        bytes32 _friendsMerkleRoot,
        uint256 _setupDelay
    )
        public
    {
        identity = _identity;
        secretThesholdHash = _secretThresholdHash;
        userDataHash = _userDataHash;
        friendsMerkleRoot = _friendsMerkleRoot;
        setupDelay = _setupDelay;
    }

    /**
     * @notice Withdraw Ether
     */
    function withdraw()
        external
        identityOnly
    {
        identity.transfer(address(this).balance);
    }

    /**
     * @notice Withdraw ERC20
     */
    function withdrawERC20(ERC20Token _token)
        external
        identityOnly
    {
        uint256 balance = _token.balanceOf(address(this));
        _token.transfer(address(identity), balance);
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
     * @param _userDataHash Double hash of User Secret
     * @param _setupDelay Delay for changes being active
     * @param _secretThresholdHash Secret Amount of approvals required
     * @param _friendsMerkleRoot Merkle root of new secret friends list
     */
    function setup(
        bytes32 _userDataHash,
        uint256 _setupDelay,
        bytes32 _secretThresholdHash,
        bytes32 _friendsMerkleRoot
    )
        external
        identityOnly
        notRevealed(_userDataHash)
    {
        pendingSetup.timestamp = block.timestamp;
        pendingSetup.userDataHash = _userDataHash;
        pendingSetup.friendsMerkleRoot = _friendsMerkleRoot;
        pendingSetup.secretThesholdHash = _secretThresholdHash;
        pendingSetup.setupDelay = _setupDelay;
        emit SetupRequested(block.timestamp + setupDelay);
    }

    /**
     * @notice Activate a pending setup of recovery parameters
     */
    function activate()
        external
    {
        require(pendingSetup.timestamp > 0);
        require(pendingSetup.timestamp + setupDelay <= block.timestamp);
        secretThesholdHash = pendingSetup.secretThesholdHash;
        setupDelay = pendingSetup.setupDelay;
        userDataHash = pendingSetup.userDataHash;
        friendsMerkleRoot = pendingSetup.friendsMerkleRoot;
        delete pendingSetup;
        emit Activated();
    }

    /**
     * @notice Approves a recovery.
     * This method is important for when the address is an contract (such as Identity).
     * @param _secretCall Hash of the transaction
     */
    function approve(bytes32 _secretCall, bytes32 _secretHash, bytes32[] _proof)
        external
    {
        require(MerkleProof.verifyProof(_proof, friendsMerkleRoot, keccak256(msg.sender, _secretHash)));
        require(!signed[_secretCall][msg.sender]);
        signed[_secretCall][msg.sender] = true;
        emit Approved(_secretCall, msg.sender);
    }

    /**
     * @notice Approve a recovery using an ethereum signed message
     * @param _secretCall Hash of the transaction
     * @param _v signatures v
     * @param _r signatures r
     * @param _s signatures s
     */
    function approvePreSigned(bytes32 _secretCall, bytes32 _secretHash, uint8 _v, bytes32 _r, bytes32 _s, bytes32[] _proof)
        external
    {
        uint256 len = _v.length;
        require (_r.length == len);
        require (_s.length == len);
        require (_v.length == len);
        bytes32 signatureHash = ECDSA.toERC191SignedMessage(0x00,abi.encodePacked(address(identity), _secretCall));

        address signer = ecrecover(signatureHash, _v[i], _r[i], _s[i]);
        require(MerkleProof.verifyProof(_proof, friendsMerkleRoot, keccak256(signer, _secretHash)));
        require(!signed[_secretCall][signer]);
        require(signer != address(0));
        signed[_secretCall][signer] = true;
        emit Approved(_secretCall, signer);

    }

    /**
     * @notice executes an approved transaction revaling userDataHash hash, friends addresses and set new recovery parameters
     * @param _revealedSecret Single hash of User Secret
     * @param _threshold Revealed secretThesholdHash
     * @param _dest Address will be called
     * @param _data Data to be sent
     * @param _friendList friends addresses that approved
     * @param _userDataHash new recovery double hashed user userDataHash
     * @param _newFriendsHashes new friends list hashed with new recovery userDataHash hash
     * @param _newSecretThreshld Threshold using the new userDataHash
     */
    function execute(
        bytes32 _revealedSecret,
        uint256 _threshold,
        address _dest,
        bytes _data,
        address[] _friendList,
        bytes32 _userDataHash,
        bytes32 _newFriendsMerkleRoot,
        bytes32 _newSecretTheshold
        )
        external
        notRevealed(_userDataHash)
    {
        require(secretThesholdHash == keccak256(_revealedSecret, _threshold));
        require(_friendList.length >= _threshold);
        require(keccak256(identity, keccak256(_revealedSecret)) == userDataHash);
        revealed[_userDataHash] = true;
        bytes32 _secretHash = keccak256(
            identity,
            _revealedSecret,
            _dest,
            _data,
            _userDataHash,
            _newSecretTheshold,
            _newFriendsMerkleRoot
        );

        for (uint256 i = 0; i < _threshold; i++) {
            address friend = _friendList[i];
            require(friend != address(0));
            require(signed[_secretHash][friend]);
            delete signed[_secretHash][friend];
        }

        userDataHash = _userDataHash;
        secretThesholdHash = _newSecretTheshold;
        friendsMerkleRoot = _newFriendsMerkleRoot;

        emit Execution(_dest.call(_data));
    }


}