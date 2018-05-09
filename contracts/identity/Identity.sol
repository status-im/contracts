pragma solidity ^0.4.21;

import "./ERC725.sol";
import "./ERC735.sol";
import "../common/MessageSigned.sol";

/**
 * @title Self sovereign Identity
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 */
contract Identity is ERC725, ERC735, MessageSigned {

    mapping (bytes32 => Key) keys;
    mapping (bytes32 => bool) isKeyPurpose;
    mapping (uint256 => bytes32[]) keysByPurpose;
    mapping (bytes32 => Claim) claims;
    mapping (uint256 => bytes32[]) claimsByType;

    mapping (bytes32 => uint256) indexes;
    mapping (uint256 => Transaction) multisigTx;
    mapping (uint256 => uint256) purposeThreshold;
    
    uint256 txCount;
    uint256 nonce;
    address recoveryContract;
    bytes32 recoveryManager;

    struct Transaction {
        bool valid;
        address to;
        uint256 value;
        bytes data;
        uint256 approverCount;
        mapping(bytes32 => bool) approvals;
    }
    
    /**
     * @notice requires called by identity itself, otherwise forward to execute process
     */
    modifier managementOnly {
        if(msg.sender == address(this)) {
            _;
        } else {
            _execute(keccak256(msg.sender), address(this), 0, msg.data);
        }
    }

    /**
     * @notices requires called by recovery address
     */
    modifier recoveryOnly {
        require(
            recoveryContract != address(0) && 
            msg.sender == recoveryContract
        );
        _;
    }
    
    /**
     * @notice requires `_signature` from a `_key` with `_messageHash`
     * @param _key key expected out from `_signature` of `_messageHash`
     * @param _messageHash message signed in `_signature` by `_key`
     * @param _signature `_messageHash` signed by `_key`
     */
    modifier keyMessageSigned (
        bytes32 _key, 
        bytes32 _messageHash, 
        bytes _signature
    ) {
        require(
            _key == keccak256(
                recoverAddress(
                    getSignHash(_messageHash),
                    _signature
                    )
                )
            );
        _;
    }

    /**
     * @notice constructor builds identity with first key as `msg.sender`
     */
    constructor(bytes32 _key) public {
        _constructIdentity(keccak256(msg.sender));
    }    

    /**
     * @notice default function allows deposit of ETH
     */
    function () 
        public 
        payable 
    {

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
        bytes _data
    ) 
        public 
        returns (uint256 txId)
    {
        txId = _execute(keccak256(msg.sender), _to, _value, _data);   
    }

    /**
     * @notice approve a multisigned execution
     * @param _txId unique id multisig transaction
     * @param _approval approve (true) or reject (false)
     */
    function approve(uint256 _txId, bool _approval) 
        public 
        returns (bool success)
    {   
        return _approveRequest(keccak256(msg.sender), _txId, _approval);
    }

    ////////////////
    // Message Signed functions
    ////////////////
    
    /**
     * @notice execute (or request) call using ethereum signed message as authorization
     * @param _to destination of call
     * @param _value amount of ETH in call
     * @param _data data
     * @param _txCount current txCount
     * @param _key key authorizing the call
     * @param _signature signature of key
     */
    function executeMessageSigned(
        address _to,
        uint256 _value,
        bytes _data,
        uint256 _txCount,
        bytes32 _key, 
        bytes _signature
    ) 
        public 
        keyMessageSigned(
            _key,
            keccak256(
                address(this), 
                bytes4(keccak256("execute(address,uint256,bytes)")), 
                _to,
                _value,
                _data,
                _txCount
            ),
            _signature
        )
        returns (uint256 txId)
    {
        require(_txCount == txCount);
        txId = _execute(_key, _to, _value, _data);
        
    }

    /**
     * @notice approve a multisigned execution using ethereum signed message as authorization
     * @param _txId unique id multisig transaction
     * @param _approval approve (true) or reject (false)
     * @param _key key authorizing the call
     * @param _signature signature of key
     */
    function approveMessageSigned(
        uint256 _id,
        bool _approval,
        bytes32 _key, 
        bytes _signature
    ) 
        public 
        keyMessageSigned(
            _key,
            keccak256(
                address(this),
                bytes4(keccak256("approve(uint256,bool)")),
                _id,
                _approval
                ),
            _signature
        )
        returns (bool success)
    {   
        return _approveRequest(_key, _id, _approval);
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
        uint256 _purpose,
        uint256 _type
    )
        public
        managementOnly
        returns (bool success)
    {   
        _addKey(_key, _purpose, _type);
        return true;
    }

    /**
     * @notice Replaces one `_oldKey` with other `_newKey`
     * @param _purpose what purpose being replaced
     * @param _oldKey key to remove
     * @param _newKey key to add
     * @param _newType inform type of `_newKey`
     */
    function replaceKey(
        uint256 _purpose,
        bytes32 _oldKey,
        bytes32 _newKey,
        uint256 _newType
    )
        public
        managementOnly
        returns (bool success)
    {
        _addKey(_newKey, _purpose, _newType);
        _removeKey(_oldKey, _purpose);
        return true;
    } 

    /**
     * @notice Removes `_purpose` of `_key`
     * @param _key key to remove
     * @param _purpose purpose to remove
     */
    function removeKey(
        bytes32 _key,
        uint256 _purpose
    )
        public
        managementOnly
        returns (bool success)
    {
        _removeKey(_key, _purpose);
        return true;
    }

    /**
     * @notice Defines minimum approval required by key type
     * @param _purpose select purpose
     * @param _minimumApprovals select how much signatures needed
     */
    function setMinimumApprovalsByKeyType(
        uint256 _purpose,
        uint256 _minimumApprovals
    ) 
        public 
        managementOnly
    {
        require(_minimumApprovals > 0);
        require(_minimumApprovals <= keysByPurpose[_purpose].length);
        purposeThreshold[_purpose] = _minimumApprovals;
    }
    
    /**
     * @notice Defines recovery address. This is one time only action.
     * @param _recoveryContract address of recovery contract
     */
    function setupRecovery(address _recoveryContract) 
        public
        managementOnly
    {
        require(recoveryContract == address(0));
        recoveryContract = _recoveryContract;
    }
    
    ////////////////
    // Claim related
    ////////////////

    function addClaim(
        uint256 _claimType,
        uint256 _scheme,
        address _issuer,
        bytes _signature,
        bytes _data,
        string _uri
    ) 
        public 
        returns (bytes32 claimHash)
    {
        claimHash = keccak256(_issuer, _claimType);
        if (msg.sender == address(this)) {
            if (claims[claimHash].claimType > 0) {
                _modifyClaim(claimHash, _claimType, _scheme, _issuer, _signature, _data, _uri);
            } else {
                _includeClaim(claimHash, _claimType, _scheme, _issuer, _signature, _data, _uri);
            }
        } else {
            require(hasKeyPurpose(keccak256(msg.sender), CLAIM_SIGNER_KEY));
            _requestApproval(address(this), 0, msg.data);
            emit ClaimRequested(
                claimHash,
                _claimType,
                _scheme,
                _issuer,
                _signature,
                _data,
                _uri
            );
        }
    }

    function removeClaim(bytes32 _claimId) 
        public 
        returns (bool success) 
    {
        Claim memory c = claims[_claimId];
        
        require(
            msg.sender == c.issuer ||
            msg.sender == address(this)
            );
        
        // MUST only be done by the issuer of the claim, or KEYS OF PURPOSE 1, or the identity itself.
        // TODO If its the identity itself, the approval process will determine its approval.
        
        uint256 claimIdTypePos = indexes[_claimId];
        delete indexes[_claimId];
        bytes32[] storage claimsTypeArr = claimsByType[c.claimType];
        bytes32 replacer = claimsTypeArr[claimsTypeArr.length-1];
        claimsTypeArr[claimIdTypePos] = replacer;
        indexes[replacer] = claimIdTypePos;
        delete claims[_claimId];
        claimsTypeArr.length--;
        emit ClaimRemoved(_claimId, c.claimType, c.scheme, c.issuer, c.signature, c.data, c.uri);
        return true;
    }

    ////////////////
    // Recovery methods
    ////////////////

    function recoveryReset(bytes32 _newKey) 
        public 
        recoveryOnly
    {
        recoveryManager = _newKey;
        _addKey(_newKey, ACTION_KEY, 0);
        purposeThreshold[ACTION_KEY] = keysByPurpose[MANAGEMENT_KEY].length;
        _addKey(_newKey, MANAGEMENT_KEY, 0);
        purposeThreshold[MANAGEMENT_KEY] = keysByPurpose[MANAGEMENT_KEY].length;
    }
    
    /**
     * @notice 
     */
    function processRecoveryReset(uint256 _limit) 
        public 
    {
        require(recoveryManager != 0);
        uint256 limit = _limit;
        bytes32 newKey = recoveryManager;
        bytes32[] memory managers = keysByPurpose[MANAGEMENT_KEY];
        uint256 totalManagers = managers.length;
        
        if (limit == 0) {
            limit = totalManagers;
        }

        purposeThreshold[MANAGEMENT_KEY] = totalManagers - limit + 1;
        for (uint256 i = 0; i < limit; i++) {
            bytes32 manager = managers[i];
            if (manager != newKey) {
                _removeKey(manager, MANAGEMENT_KEY);
                totalManagers--;
            }
        }

        if (totalManagers == 1) {
            delete recoveryManager;
        }
    }

    ////////////////
    // Public Views
    ////////////////

    function getKey(
        bytes32 _key,
        uint256 _purpose
    ) 
        public 
        view 
        returns(uint256[] purposes, uint256 keyType, bytes32 key) 
    {
        Key storage myKey = keys[_key];
        return (myKey.purposes, myKey.keyType, myKey.key);
    }
    
    function hasKeyPurpose(bytes32 _key, uint256 _purpose) 
        public
        view 
        returns (bool)
    {
        return isKeyPurpose[keccak256(_key, _purpose)];
    }

    function getKeyPurpose(bytes32 _key)
        public 
        view 
        returns(uint256[] purpose)
    {
        return keys[_key].purposes;
    }
    
    function getKeysByPurpose(uint256 _purpose)
        public
        view
        returns(bytes32[])
    {
        return keysByPurpose[_purpose];
    }
    
    function getClaim(bytes32 _claimId)
        public
        view 
        returns(
            uint256 claimType,
            uint256 scheme,
            address issuer,
            bytes signature,
            bytes data,
            string uri
            ) 
    {
        Claim memory _claim = claims[_claimId];
        return (_claim.claimType, _claim.scheme, _claim.issuer, _claim.signature, _claim.data, _claim.uri);
    }
    
    function getClaimIdsByType(uint256 _claimType)
        public
        view
        returns(bytes32[] claimIds)
    {
        return claimsByType[_claimType];
    }

    ////////////////
    // Internal methods
    ////////////////

    function _constructIdentity(bytes32 _managerKey)
        internal 
    {
        require(keysByPurpose[MANAGEMENT_KEY].length == 0);
        require(purposeThreshold[MANAGEMENT_KEY] == 0);
        _addKey(_managerKey, MANAGEMENT_KEY, 0);
        _addKey(_managerKey, ACTION_KEY, 0);

        purposeThreshold[MANAGEMENT_KEY] = 1;
        purposeThreshold[ACTION_KEY] = 1;
    }

    function _execute(
        bytes32 _key,
        address _to,
        uint256 _value,
        bytes _data
    ) 
        internal 
        returns (uint256 txId)
    {
        uint256 requiredPurpose = _to == address(this) ? MANAGEMENT_KEY : ACTION_KEY;
        require(hasKeyPurpose(_key, requiredPurpose));
        if (purposeThreshold[requiredPurpose] == 1) {
            txId = txCount++;
            _commitCall(txId, _to, _value, _data);
        } else {
            txId = _requestApproval(_to, _value, _data);
            _approveRequest(_key, txId, true);
        } 
    }

    function _commitCall(
        uint256 _txId,
        address _to,
        uint256 _value,
        bytes _data
    ) 
        internal 
        returns(bool success)
    {
        nonce++;
        success = _to.call.value(_value)(_data);
        if (success) {
            emit Executed(_txId, _to, _value, _data); 
        } else {
            emit ExecutionFailed(_txId, _to, _value, _data);
        }
    }

    function _requestApproval(
        address _to,
        uint256 _value,
        bytes _data
    )
        internal 
        returns (uint256 txId)
    {
        txId = txCount++;
        multisigTx[txCount] = Transaction({
            valid: true,
            to: _to,
            value: _value,
            data: _data,
            approverCount: 0
        });
        emit ExecutionRequested(txId, _to, _value, _data);
    }

    ////////////////
    // Private methods
    ////////////////

    function _approveRequest(
        bytes32 _key,
        uint256 _id,
        bool _approval
    ) 
        private 
        returns(bool success) //(?) should return approved instead of success?
    {
        
        Transaction memory approvedTx = multisigTx[_id];
        require(approvedTx.valid);
        uint256 requiredKeyPurpose = approvedTx.to == address(this) ? MANAGEMENT_KEY : ACTION_KEY;
        require(hasKeyPurpose(_key, requiredKeyPurpose));
        require(multisigTx[_id].approvals[_key] != _approval);
        
        emit Approved(_id, _approval);
        
        if (_approval) {
            if (approvedTx.approverCount + 1 == purposeThreshold[requiredKeyPurpose]) {
                delete multisigTx[_id];
                return _commitCall(_id, approvedTx.to, approvedTx.value, approvedTx.data);
            } else {
                multisigTx[_id].approverCount++;
            }
        } else {
            multisigTx[_id].approverCount--;
        }
    
        multisigTx[_id].approvals[_key] = _approval;
    }

    function _addKey(
        bytes32 _key,
        uint256 _purpose,
        uint256 _type
    ) 
        private
    {
        require(_purpose > 0);
        bytes32 keyPurposeHash = keccak256(_key, _purpose);
        
        require(!isKeyPurpose[keyPurposeHash]);
        isKeyPurpose[keyPurposeHash] = true;
        indexes[keyPurposeHash] = keysByPurpose[_purpose].push(_key) - 1;
        if (keys[_key].key == 0) {
            uint256[] memory purposes = new uint256[](_purpose); 
            keys[_key] = Key(purposes,_type,_key);
            keys[_key].key == _key;
            keys[_key].keyType == _type;
        } else {
            indexes[keccak256(keyPurposeHash)] = keys[_key].purposes.push(_purpose) - 1;
        }
        
        emit KeyAdded(_key, _purpose, _type);
    }

    function _removeKey(
        bytes32 _key,
        uint256 _purpose
    )
        private 
    {
        //forbidden to remove last management key
        if (_purpose == MANAGEMENT_KEY) {
            require(keysByPurpose[MANAGEMENT_KEY].length > purposeThreshold[MANAGEMENT_KEY]);
        }

        //require isKeyPurpose mapping and remove it
        bytes32 keyPurposeHash = keccak256(_key, _purpose);
        require(isKeyPurpose[keyPurposeHash]);
        delete isKeyPurpose[keyPurposeHash];

        //remove keys by purpose array element
        uint256 removedIndex = indexes[keyPurposeHash];
        delete indexes[keyPurposeHash];
        uint256 replacerIndex = keysByPurpose[_purpose].length - 1; // replacer is last element
        if(removedIndex != replacerIndex) { 
            bytes32 replacerKey = keysByPurpose[_purpose][replacerIndex];
            keysByPurpose[_purpose][removedIndex] = replacerKey; //overwrite removed index by replacer
            indexes[keccak256(replacerKey, _purpose)] = removedIndex; //update index of replacer
        }
        keysByPurpose[_purpose].length--; //remove last element

        //remove key purposes array element
        Key storage myKey = keys[_key];
        uint256 _type = myKey.keyType;
        replacerIndex = myKey.purposes.length - 1;
        if (replacerIndex > 0) {
            bytes32 keyPurposeHashHash = keccak256(keyPurposeHash);
            removedIndex = indexes[keyPurposeHashHash];
            delete indexes[keyPurposeHashHash];
            if(removedIndex != replacerIndex) { 
                uint256 replacerPurpose = myKey.purposes[replacerIndex];
                myKey.purposes[removedIndex] = replacerPurpose;
                indexes[keccak256(keccak256(_key, replacerPurpose))] = removedIndex;
            }
            myKey.purposes.length--;
        } else {
            delete keys[_key];
        }
        
        emit KeyRemoved(_key, _purpose, _type);
    }

    function _includeClaim(
        bytes32 _claimHash,
        uint256 _claimType,
        uint256 _scheme,
        address _issuer,
        bytes _signature,
        bytes _data,
        string _uri
    ) 
        private
    {
        claims[_claimHash] = Claim(
            {
            claimType: _claimType,
            scheme: _scheme,
            issuer: _issuer,
            signature: _signature,
            data: _data,
            uri: _uri
            }
        );
        indexes[_claimHash] = claimsByType[_claimType].length;
        claimsByType[_claimType].push(_claimHash);
        emit ClaimAdded(
            _claimHash,
            _claimType,
            _scheme,
            _issuer,
            _signature,
            _data,
            _uri
        );
    }

    function _modifyClaim(
        bytes32 _claimHash,
        uint256 _claimType,
        uint256 _scheme,
        address _issuer,
        bytes _signature,
        bytes _data,
        string _uri
    ) 
        private
    {
        require(msg.sender == _issuer);
        claims[_claimHash] = Claim({
            claimType: _claimType,
            scheme: _scheme,
            issuer: _issuer,
            signature: _signature,
            data: _data,
            uri: _uri
        });
        emit ClaimChanged(
            _claimHash,
            _claimType,
            _scheme,
            _issuer,
            _signature,
            _data,
            _uri
        );
    }

    
}

