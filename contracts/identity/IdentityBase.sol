pragma solidity >=0.5.0 <0.6.0;

import "./IdentityView.sol";
import "../deploy/DelegatedCall.sol";
import "../deploy/PrototypeRegistry.sol";

/**
 * @title IdentityBase
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @notice Cannot be used stand-alone, use IdentityFactory.createIdentity
 */
contract IdentityBase is IdentityView, DelegatedCall {
    
    modifier curatedExtension(IdentityAbstract _extension) {
        require(prototypeRegistry.isExtension(base,_extension));
        _;
    }

    constructor() 
        public
        DelegatedCall(address(0), new bytes(0))
    {

    }

    /**
     * @notice default function allows deposit of ETH
     */
    function () 
        external 
        payable 
        initialized
        delegateAndReturn(address(extensions[msg.sig]))
    {
        //executes only when no extension found
        //no behavior, but msg.value is accepted
    }

    ////////////////
    // Execute calls and multisig approval
    ////////////////

    /**
     * @notice execute (or request) call
     * @param _to destination of call
     * @param _value amount of ETH in call
     * @param _data data
     */
    function execute(
        address _to,
        uint256 _value,
        bytes calldata _data
    ) 
        external 
        returns (uint256 txId)
    {
        txId = _requestExecute(keccak256(abi.encodePacked(msg.sender)), _to, _value, _data);   
    }

    /**
     * @notice approve a multisigned execution
     * @param _txId unique id multisig transaction
     * @param _approval approve (true) or reject (false)
     */
    function approve(uint256 _txId, bool _approval) 
        external 
        returns (bool success)
    {   
        return _approveRequest(keccak256(abi.encodePacked(msg.sender)), _txId, _approval);
    }
    
    ////////////////
    // Management functions 
    ////////////////

    /**
     * @notice Adds a _key to the identity. The `_purpose`  
     * @param _key key hash being added
     * @param _purpose specifies the purpose of key.
     * @param _type inform type of key 
     */
    function addKey(
        bytes32 _key,
        Purpose _purpose,
        uint256 _type
    )
        external
        managementOnly
        returns (bool success)
    {   
        _addKey(_key, _purpose, _type, salt);
        return true;
    }

    /**
     * @notice Replaces one `_oldKey` with other `_newKey`
     * @param _oldKey key to remove
     * @param _newKey key to add
     * @param _newType inform type of `_newKey`
     */
    function replaceKey(
        bytes32 _oldKey,
        bytes32 _newKey,
        uint256 _newType
    )
        external
        managementOnly
        returns (bool success)
    {   
        return _replaceKey(_oldKey, _newKey, _newType, salt);
    } 

    /**
     * @notice Removes `_purpose` of `_key`
     * @param _key key to remove
     * @param _purpose purpose to remove
     */
    function removeKey(
        bytes32 _key,
        Purpose _purpose
    )
        external
        managementOnly
        returns (bool success)
    {
        _removeKey(_key, _purpose, salt);
        return true;
    }

    /**
     * @notice Defines minimum approval required by key type
     * @param _purpose select purpose
     * @param _minimumApprovals select how much signatures needed
     */
    function setMinimumApprovalsByKeyType(
        Purpose _purpose,
        uint256 _minimumApprovals
    ) 
        external 
        managementOnly
    {
        require(_minimumApprovals > 0,"Invalid argument");
        require(_minimumApprovals <= keysByPurpose[keccak256(abi.encodePacked(_purpose, salt))].length, "Invalid argument");
        purposeThreshold[uint256(_purpose)] = _minimumApprovals;
    }
    
    /**
     * @notice Defines recovery address. This is one time only action.
     * @param _recoveryContract address of recovery contract
     */
    function setupRecovery(address _recoveryContract) 
        external
        managementOnly
    {
        require(recoveryContract == address(0), "Unauthorized");
        recoveryContract = _recoveryContract;
    }

    function upgradeBase(
        IdentityAbstract _newBase
    ) 
        external
        managementOnly
    {
        require(prototypeRegistry.isUpgradable(base, _newBase));
        base = _newBase;
    }

    function installExtension(IdentityAbstract _extension, bool) 
        external
        managementOnly
        curatedExtension(_extension)
        delegateAndReturn(address(_extension))
    {
        assert(false);
    }
    
    ////////////////
    // Claim related
    ////////////////

    function addClaim(
        uint256 _topic,
        uint256 _scheme,
        address _issuer,
        bytes calldata _signature,
        bytes calldata _data,
        string calldata _uri
    ) 
        external 
        returns (bytes32 claimHash)
    {
        claimHash = keccak256(abi.encodePacked(_issuer, _topic));
        if (msg.sender == address(this)) {
            if (claims[claimHash].topic > 0) {
                _modifyClaim(claimHash, _topic, _scheme, _issuer, _signature, _data, _uri);
            } else {
                _includeClaim(claimHash, _topic, _scheme, _issuer, _signature, _data, _uri);
            }
        } else {
            require(_keyHasPurpose(keccak256(abi.encodePacked(msg.sender)), Purpose.ClaimSignerKey), "Bad key");
            _requestApproval(0, address(this), 0, msg.data);
            emit ClaimRequested(
                claimHash,
                _topic,
                _scheme,
                _issuer,
                _signature,
                _data,
                _uri
            );
        }
    }

    function removeClaim(bytes32 _claimId) 
        external 
        returns (bool success) 
    {
        Claim memory c = claims[_claimId];
        
        require(
            msg.sender == c.issuer ||
            msg.sender == address(this),
            "Unauthorized");
        
        // MUST only be done by the issuer of the claim, or KEYS OF PURPOSE 1, or the identity itself.
        // TODO If its the identity itself, the approval process will determine its approval.
        
        uint256 claimIdTopicPos = indexes[_claimId];
        delete indexes[_claimId];
        bytes32[] storage claimsTopicArr = claimsByType[c.topic];
        bytes32 replacer = claimsTopicArr[claimsTopicArr.length - 1];
        claimsTopicArr[claimIdTopicPos] = replacer;
        indexes[replacer] = claimIdTopicPos;
        delete claims[_claimId];
        claimsTopicArr.length--;
        emit ClaimRemoved(_claimId, c.topic, c.scheme, c.issuer, c.signature, c.data, c.uri);
        return true;
    }

    ////////////////
    // Recovery methods
    ////////////////

    /** 
     * @notice Increase salt for hashing storage pointer of keys and add `_recoveryNewKey` 
     * @param _recoveryNewKey new key being defined
     */
    function recoveryReset(bytes32 _recoveryNewKey) 
        external 
        recoveryOnly
    {
        salt++;
        _addKey(_recoveryNewKey, Purpose.ManagementKey, 0, salt);
        _addKey(_recoveryNewKey, Purpose.ActionKey, 0, salt);
        purposeThreshold[uint256(Purpose.ManagementKey)] = 1;
    }
    
   
}

