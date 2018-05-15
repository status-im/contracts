pragma solidity ^0.4.23;

import "./ERC725.sol";
import "./ERC735.sol";
import "../common/MessageSigned.sol";

/**
 * @title Self sovereign Identity
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 */
contract Identity is MessageSigned, ERC725, ERC735 {

    uint256 public nonce; //not approved transactions reserve nonce
    address public recovery; //if defined can change salt and add a new key
    uint256 salt; //used for disabling all authorizations at once

    //used internally, store index of keys, claims and array elements position 
    mapping (bytes32 => uint256) indexes;  

    mapping (bytes32 => Key) keys; //used for quering by other contracts
    mapping (bytes32 => bool) isKeyPurpose; //used for authorization
    mapping (bytes32 => bytes32[]) keysByPurpose; //used for listing

    mapping (uint256 => Transaction) pendingTx; //used for multisig
    mapping (uint256 => uint256) purposeThreshold; //configure multisig

    mapping (bytes32 => Claim) claims; //used for quering by other contracts
    mapping (uint256 => bytes32[]) claimsByType; //used for listing
    
    struct Transaction {
        uint256 approverCount; //amount of approvals
        address to;
        uint256 value;
        bytes data;
        mapping(bytes32 => bool) approvals; //used for no key double approving
    }
    
    /**
     * @notice requires called by identity itself, otherwise forward to execute process
     */
    modifier managementOnly {
        if(msg.sender == address(this)) { 
            //call passed multisig process
            _;
        } else {
            //request execution
            keyRequestExecute(keccak256(msg.sender), address(this), 0, msg.data);
        }
    }

    /**
     * @notice requires called by recovery address
     */
    modifier recoveryOnly {
        require(
            msg.sender == recovery 
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
                ),
                salt
            )                    
        );
        _;
    }

    /**
     * @notice constructor builds identity with provided `_keys` 
     *         or uses `msg.sender` as first MANAGEMENT + ACTION key
     * @param _keys Keys to add
     * @param _purposes `_keys` corresponding purposes
     * @param _types `_keys` corresponding types
     * @param _managerThreshold how much keys needs to sign management calls
     * @param _actorThreshold how much keys need to sign action management calls
     * @param _recoveryContract Option to initialize with recovery defined
     */
    constructor(   
        bytes32[] _keys,
        uint256[] _purposes,
        uint256[] _types,
        uint256 _managerThreshold,
        uint256 _actorThreshold,
        address _recoveryContract
    ) public {
        bytes32[] memory initKeys = _keys;
        uint256[] memory initPurposes = _purposes;
        uint256[] memory initTypes = _types;
        uint256 managerThreshold = _managerThreshold;
        
        if (_keys.length == 0) {
            initKeys = new bytes32[](2);
            initPurposes = new uint256[](2);
            initTypes = new uint256[](2);
            initKeys[0] = keccak256(msg.sender);
            initKeys[1] = initKeys[0];
            initPurposes[0] = MANAGEMENT_KEY;
            initPurposes[1] = ACTION_KEY;
            initTypes[0] = 0;
            initTypes[1] = 0;
            managerThreshold = 1;
        }
        
        constructIdentity(
            initKeys,
            initPurposes,
            initTypes,
            managerThreshold,
            _actorThreshold,
            _recoveryContract
        );
    }    

    /**
     * @notice default function allows deposit of ETH
     */
    function () 
        external //enables default method 
        payable  //accepts ether
    {
        //nothing *here*
    }

    ////////////////
    // Execute calls and multisig approval
    ////////////////

    /**
     * @notice execute (or request) call
     * @param _to destination of call
     * @param _value amount of ETH in call
     * @param _data data
     * @return nonce of the execution
     */
    function execute(
        address _to,
        uint256 _value,
        bytes _data
    ) 
        public 
        returns (uint256 executionId)
    {
        executionId = keyRequestExecute(keccak256(msg.sender), _to, _value, _data);   
    }

    /**
     * @notice approve a multisigned execution
     * @param _executionId unique id multisig transaction
     * @param _approval approve (true) or reject (false)
     * @return true if approved
     */
    function approve(uint256 _executionId, bool _approval) 
        public 
        returns (bool success)
    {   
        return keyApproveExecute(keccak256(msg.sender), _executionId, _approval);
    }

    ////////////////
    // Message Signed functions
    ////////////////
    
    /**
     * @notice execute (or request) call using ethereum signed message as authorization
     * @param _to destination of call
     * @param _value amount of ETH in call
     * @param _data data
     * @param _nonce current nonce
     * @param _key key authorizing the call
     * @param _signature signature of key
     * @return nonce of the execution
     */
    function executeMessageSigned(
        address _to,
        uint256 _value,
        bytes _data,
        uint256 _nonce,
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
                _nonce
            ),
            _signature
        )
        returns (uint256 executionId)
    {
        require(_nonce == nonce);
        executionId = keyRequestExecute(_key, _to, _value, _data);
        
    }

    /**
     * @notice approve a multisigned execution using ethereum signed message as authorization
     * @param _executionId unique id multisig transaction
     * @param _approval approve (true) or reject (false)
     * @param _key key authorizing the call
     * @param _signature signature of key
     * @return true if approved
     */
    function approveMessageSigned(
        uint256 _executionId,
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
                _executionId,
                _approval
                ),
            _signature
        )
        returns (bool success)
    {   
        return keyApproveExecute(_key, _executionId, _approval);
    }
    
    
    ////////////////
    // Management functions 
    ////////////////

    /**
     * @notice Adds a _key to the identity. The `_purpose`  
     * @param _key key hash being added
     * @param _purpose specifies the purpose of key.
     * @param _type inform type of key 
     * @return true if success
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
        storeKey(_key, _purpose, _type, salt);
        return true;
    }

    /**
     * @notice Replaces one `_oldKey` with other `_newKey`
     * @param _oldKey key to remove
     * @param _newKey key to add
     * @param _newType inform type of `_newKey`
     * @return true if success
     */
    function replaceKey(
        bytes32 _oldKey,
        bytes32 _newKey,
        uint256 _newType
    )
        public
        managementOnly
        returns (bool success)
    {   
        return overwriteKey(_oldKey, _newKey, _newType, salt);
    } 

    /**
     * @notice Removes `_purpose` of `_key`
     * @param _key key to remove
     * @param _purpose purpose to remove
     * @return true if success
     */
    function removeKey(
        bytes32 _key,
        uint256 _purpose
    )
        public
        managementOnly
        returns (bool success)
    {
        dropKeyPurpose(_key, _purpose, salt);
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
        require(_minimumApprovals <= keysByPurpose[keccak256(_purpose, salt)].length);
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
        require(recovery == address(0));
        recovery = _recoveryContract;
    }
    
    ////////////////
    // Claim related
    ////////////////

    /**
     * @notice Requests the ADDITION or the CHANGE of a claim from an `_issuer`.
     *         Claims can requested to be added by anybody, including the claim holder itself (self issued).
     * @param _topic claim subject/type index 
     * @param _scheme signature type
     * @param _signature Signed message of the following structure: `keccak256(address identityHolder_address, uint256 topic, bytes data)`.
     * @param _issuer address of msg signer or contract 
     * @param _data information 
     * @param _uri uri
     * @return claimHash: `keccak256(_issuer, _topic)`
     */
    function addClaim(
        uint256 _topic,
        uint256 _scheme,
        address _issuer,
        bytes _signature,
        bytes _data,
        string _uri
    ) 
        public 
        returns (bytes32 claimHash)
    {
        claimHash = keccak256(_issuer, _topic);
        if (msg.sender == address(this)) {
            if (claims[claimHash].topic > 0) {
                updateClaim(claimHash, _topic, _scheme, _issuer, _signature, _data, _uri);
            } else {
                storeClaim(claimHash, _topic, _scheme, _issuer, _signature, _data, _uri);
            }
        } else {
            require(keyHasPurpose(keccak256(msg.sender), CLAIM_SIGNER_KEY));
            keyRequestApproval(nonce++, 0, address(this), 0, msg.data);
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
    /** 
     * @notice Removes a claim. Can only be removed by the claim issuer, or the claim holder itself.
     * @param _claimHash claimId keccak256(address issuer_address + uint256 topic)
     * @return true if success
     */
    function removeClaim(bytes32 _claimHash) 
        public 
        returns (bool success) 
    {
        Claim memory c = claims[_claimHash];
        
        if (msg.sender != address(this)) {
            require(msg.sender == c.issuer);
        }
        
        uint256 claimIdTopicPos = indexes[_claimHash];
        delete indexes[_claimHash];
        bytes32[] storage claimsTopicArr = claimsByType[c.topic];
        bytes32 replacer = claimsTopicArr[claimsTopicArr.length - 1];
        claimsTopicArr[claimIdTopicPos] = replacer;
        indexes[replacer] = claimIdTopicPos;
        delete claims[_claimHash];
        claimsTopicArr.length--;
        emit ClaimRemoved(_claimHash, c.topic, c.scheme, c.issuer, c.signature, c.data, c.uri);
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
        public 
        recoveryOnly
    {
        salt++;
        storeKey(_recoveryNewKey, MANAGEMENT_KEY, 0, salt);
        storeKey(_recoveryNewKey, ACTION_KEY, 0, salt);
        purposeThreshold[MANAGEMENT_KEY] = 1;
    }
    
    ////////////////
    // Public Views
    ////////////////

    /** 
     * @notice Query a key
     * @param _key key to select
     * @return full key data, if present in the identity
     */
    function getKey(
        bytes32 _key
    ) 
        public 
        view 
        returns(uint256[] purposes, uint256 keyType, bytes32 key) 
    {
        Key storage myKey = keys[keccak256(_key, salt)];
        return (myKey.purposes, myKey.keyType, myKey.key);
    }
    /**
     * @notice Check key purpose
     * @param _key key to select
     * @param _purpose purpose to select
     * @return true if a key has is present and has the given purpose
     */
    function keyHasPurpose(bytes32 _key, uint256 _purpose) 
        public
        view 
        returns (bool exists) 
    {
        return isKeyPurpose[keccak256(keccak256(_key, salt), _purpose)];
    }

    /**
     * @notice Read array of purposes from key `_key`
     * @param _key key to select
     * @return array of key's purposes
     */
    function getKeyPurpose(bytes32 _key)
        public 
        view 
        returns(uint256[] purpose)
    {
        return keys[keccak256(_key, salt)].purposes;
    }
    
    /**
     * @notice Read keys defined for a purpose
     * @param _purpose purpose to select
     * @return array of keys
     */
    function getKeysByPurpose(uint256 _purpose)
        public
        view
        returns(bytes32[])
    {
        return keysByPurpose[keccak256(_purpose, salt)];
    }
    
    /**
     * @notice Gets a claim by its hash
     * @param _claimHash claimHash to select
     * @return all claim information
     */
    function getClaim(bytes32 _claimHash)
        public
        view 
        returns(
            uint256 topic,
            uint256 scheme,
            address issuer,
            bytes signature,
            bytes data,
            string uri
            ) 
    {
        Claim memory _claim = claims[_claimHash];
        return (_claim.topic, _claim.scheme, _claim.issuer, _claim.signature, _claim.data, _claim.uri);
    }
    
    /**
     * @notice Get claims list by defined topic 
     * @param _topic topic to select
     * @return array of claimhashes
     */
    function getClaimIdsByTopic(uint256 _topic)
        public
        view
        returns(bytes32[] claimHash)
    {
        return claimsByType[_topic];
    }

    ////////////////
    // Internal methods
    ////////////////

    /**
     * @dev initialize identity
     * @param _keys array of keys, length need to be greater than zero
     * @param _purposes array of keys's purposes, length need == keys length 
     * @param _types array of key's types, length need == keys length
     * @param _managerThreshold how much managers need to approve self call, need to be at least managers added
     * @param _actorThreshold how much actors need to approve external call
     * @param _recoveryContract optionally initialize with recovery contract
     */
    function constructIdentity(
        bytes32[] _keys,
        uint256[] _purposes,
        uint256[] _types,
        uint256 _managerThreshold,
        uint256 _actorThreshold,
        address _recoveryContract
    )
        internal 
    {
        uint256 _salt = salt;
        uint len = _keys.length;
        require(len > 0);
        require(purposeThreshold[MANAGEMENT_KEY] == 0, "Already Initialized (1)");
        require(keysByPurpose[keccak256(MANAGEMENT_KEY, _salt)].length == 0, "Already Initialized (2)");
        require(len == _purposes.length, "Wrong _purposes lenght");
        uint managersAdded = 0;
        for(uint i = 0; i < len; i++) {
            uint256 _purpose = _purposes[i];
            storeKey(_keys[i], _purpose, _types[i], _salt);
            if(_purpose == MANAGEMENT_KEY) {
                managersAdded++;
            }
        }
        require(_managerThreshold <= managersAdded, "managers added is less then required");
        purposeThreshold[MANAGEMENT_KEY] = _managerThreshold;
        purposeThreshold[ACTION_KEY] = _actorThreshold;
        recovery = _recoveryContract;
    }

    /**
     * @dev previously authenticated `_key` request execution
     * @return execution id of executed or pending multisig
     */
    function keyRequestExecute(
        bytes32 _key,
        address _to,
        uint256 _value,
        bytes _data
    ) 
        internal 
        returns (uint256 executionId)
    {
        // checks if is self call (management functions)
        uint256 requiredPurpose = _to == address(this) ? MANAGEMENT_KEY : ACTION_KEY;
        require(keyHasPurpose(_key, requiredPurpose));
        executionId = nonce++;
        if (purposeThreshold[requiredPurpose] == 1) {
            //only one key is needed, dont need approval
            executeTransaction(executionId, _to, _value, _data);
        } else {
            //more confirmations are required
            keyRequestApproval(executionId, _key, _to, _value, _data);
        } 
    }

    /**
     * @dev previously authenticated `_key` request approval and approve
     * @param _key key that approves 
     */
    function keyRequestApproval(
        uint256 _executionId,
        bytes32 _key,
        address _to,
        uint256 _value,
        bytes _data
    )
        internal 
    {        
        pendingTx[_executionId] = Transaction({
            approverCount: _key == 0 ? 0 : 1,
            to: _to,
            value: _value,
            data: _data
        });
        
        if (_key != 0) {
            pendingTx[_executionId].approvals[_key] = true;
        }

        emit ExecutionRequested(_executionId, _to, _value, _data);
    }

    /**
     * @dev previously authenticated `_key` approve execute
     * @param _key key that approves
     * @return true if approved
     */
    function keyApproveExecute(
        bytes32 _key,
        uint256 _executionId,
        bool _approval
    ) 
        internal 
        returns(bool success) //(?) should return approved instead of success?
    {
        
        Transaction memory approvedTx = pendingTx[_executionId];
        require(approvedTx.approverCount > 0); //requires a valid pending tx
        uint256 requiredKeyPurpose = approvedTx.to == address(this) ? MANAGEMENT_KEY : ACTION_KEY;
        require(keyHasPurpose(_key, requiredKeyPurpose));
        require(pendingTx[_executionId].approvals[_key] != _approval); //require changing approval
        
        if (_approval) {
            if (approvedTx.approverCount + 1 == purposeThreshold[requiredKeyPurpose]) {
                //last one aproving!
                delete pendingTx[_executionId]; //prevent reexecution by deleting
                emit Approved(_executionId, _approval); //approved!
                return executeTransaction(_executionId, approvedTx.to, approvedTx.value, approvedTx.data); 
            } else {
                //need more approving
                pendingTx[_executionId].approvals[_key] = true;
                pendingTx[_executionId].approverCount++;
            }
        } else {
            //woops, user changed mind, disapprove it now
            delete pendingTx[_executionId].approvals[_key];
            if (pendingTx[_executionId].approverCount == 1) { //is last approval
                delete pendingTx[_executionId];
                emit Approved(_executionId, _approval); //not approved (removed)
            } else {
                pendingTx[_executionId].approverCount--; //one less approver now
            }
        }
    }

    /**
     * @dev contract execute transactio
     * @return true if call didnt throw
     */
    function executeTransaction(
        uint256 _executionId,
        address _to,
        uint256 _value,
        bytes _data
    ) 
        internal 
        returns(bool success)
    {
        success = _to.call.value(_value)(_data);
        if (success) {
            emit Executed(_executionId, _to, _value, _data); 
        } else {
            emit ExecutionFailed(_executionId, _to, _value, _data);
        }
    }

    ////////////////
    // Private methods
    ////////////////

    /**
     * @dev store a new key or push purpose of already exists
     * @param _salt current salt
     * @return true if success
     */
    function storeKey(
        bytes32 _key,
        uint256 _purpose,
        uint256 _type,
        uint256 _salt
    ) 
        private
        returns(bool success)
    {
        require(_key != 0);
        require(_purpose != 0);
        
        bytes32 keySaltedHash = keccak256(_key, _salt); //key storage pointer
        bytes32 saltedKeyPurposeHash = keccak256(keySaltedHash, _purpose); // accounts by purpose hash element index pointer

        require(!isKeyPurpose[saltedKeyPurposeHash]); //cannot add a key already added
        isKeyPurpose[saltedKeyPurposeHash] = true; //set authorization
        uint256 keyElementIndex = keysByPurpose[saltedKeyPurposeHash].push(_key) - 1; //add key to list by purpose 
        indexes[saltedKeyPurposeHash] = keyElementIndex; //save index of key in list by purpose
        if (keys[keySaltedHash].key == 0) { //is a new key
            uint256[] memory purposes = new uint256[](1);  //create new array with first purpose
            purposes[0] = _purpose;
            keys[keySaltedHash] = Key(purposes,_type,_key); //add new key
        } else {
            uint256 addedPurposeElementIndex = keys[keySaltedHash].purposes.push(_purpose) - 1; //add purpose to key
            bytes32 keyPurposeSaltedHash = keccak256(_key, _purpose, _salt); //index of purpose in key pointer
            indexes[keyPurposeSaltedHash] = addedPurposeElementIndex; //save index
        }
        
        emit KeyAdded(_key, _purpose, _type);
        return true;
    }
    
    /**
     * @dev remove purpose from key or delete key if is last purpose
     * @param _salt index of mapping
     * @return true if success
     */
    function dropKeyPurpose(
        bytes32 _key,
        uint256 _purpose,
        uint256 _salt
    )
        private 
    {
        bytes32 keySaltedHash = keccak256(_key, _salt); // key storage pointer
        dropKeyFromPurposesList(keySaltedHash, _purpose, _salt);
        //remove key purposes array purpose element
        Key storage myKey = keys[keySaltedHash]; //load Key storage pointer
        uint256 _type = myKey.keyType; //save type for case key deleted
        uint256 replacerPurposeIndex = myKey.purposes.length; //load amount of purposes
        bytes32 keyPurposeSaltedHash = keccak256(_key, _purpose, _salt); //account purpose array element index
        uint256 removedPurposeIndex = indexes[keyPurposeSaltedHash]; //read old index
        delete indexes[keyPurposeSaltedHash]; //delete key's purpose index
        if (replacerPurposeIndex > 1) { //is not the last key
            replacerPurposeIndex--; //move to last element pos
            if(removedPurposeIndex != replacerPurposeIndex) { //removed element is not last element
                uint256 replacerPurpose = myKey.purposes[replacerPurposeIndex]; //take last element
                myKey.purposes[removedPurposeIndex] = replacerPurpose; //replace removed element with replacer element
                indexes[keccak256(_key, replacerPurpose, _salt)] = removedPurposeIndex; //update index
            }
            myKey.purposes.length--; //remove last element
        } else { //is the last purpose
            delete keys[keySaltedHash]; //drop this Key 
        }
        
        emit KeyRemoved(_key, _purpose, _type);
    }

    /**
     * @dev remove key from purpose list
     * @param _salt index of mapping
     */
    function dropKeyFromPurposesList(
        bytes32 keySaltedHash,
        uint256 _purpose,
        uint256 _salt
    ) 
        private
    {
        bytes32 purposeSaltedHash = keccak256(_purpose, _salt); // salted accounts by purpose array index pointer   
        // forbidden to remove last management key
        if (_purpose == MANAGEMENT_KEY) {
            require(purposeThreshold[MANAGEMENT_KEY] <= keysByPurpose[purposeSaltedHash].length-1);
        }

        bytes32 saltedKeyPurposeHash = keccak256(keySaltedHash, _purpose); // accounts by purpose hash element index pointer
        require(isKeyPurpose[saltedKeyPurposeHash]); //not possible to remove what not exists
        delete isKeyPurpose[saltedKeyPurposeHash]; //remove authorization

        // remove keys by purpose array key element
        uint256 removedKeyIndex = indexes[saltedKeyPurposeHash]; // read old key element index
        delete indexes[saltedKeyPurposeHash]; // delete key index
        
        uint256 replacerKeyIndex = keysByPurpose[purposeSaltedHash].length - 1; // replacer is last element
        if (removedKeyIndex != replacerKeyIndex) {  // deleted not the last element, replace deleted by last element
            bytes32 replacerKey = keysByPurpose[purposeSaltedHash][replacerKeyIndex]; // get replacer key 
            keysByPurpose[purposeSaltedHash][removedKeyIndex] = replacerKey; // overwrite removed index by replacer
            indexes[keccak256(keccak256(replacerKey, _salt), _purpose)] = removedKeyIndex; // update saltedKeyPurposeHash index of replacer
        }
        keysByPurpose[purposeSaltedHash].length--; // remove last element
    }
    
    /**
     * @notice Replaces one `_oldKey` with other `_newKey`. If same key, only update type.
     * @param _oldKey key to remove
     * @param _newKey key to add
     * @param _newType inform type of `_newKey`
     * @param _salt index of mapping
     * @return true if success
     */
    function overwriteKey(
        bytes32 _oldKey,
        bytes32 _newKey,
        uint256 _newType,
        uint256 _salt
    )
        private
        returns (bool success)
    {   
        bytes32 newKeySaltedHash = keccak256(_newKey, _salt); // key storage pointer     
        if (_oldKey == _newKey) { //not replacing key, just keyType
            keys[newKeySaltedHash].keyType == _newType; 
            return true;
        }
        bytes32 oldKeySaltedHash = keccak256(_oldKey, _salt); // key storage pointer     
        Key memory oldKey = keys[oldKeySaltedHash];
        delete keys[oldKeySaltedHash];
        uint256 len = oldKey.purposes.length;
        for (uint i = 0; i < len; i++) {
            overwriteKeyPurpose(oldKeySaltedHash, oldKeySaltedHash, _oldKey, _newKey, oldKey.purposes[i], _salt);
        }
        keys[newKeySaltedHash] = Key(oldKey.purposes, _newType, _newKey); //add new key
        return true;
    } 

    /**
     * @dev overwrite purpose indexes and key lists
     * @param _salt index of mapping
     */
    function overwriteKeyPurpose(
        bytes32 newKeySaltedHash,
        bytes32 oldKeySaltedHash,
        bytes32 _oldKey,
        bytes32 _newKey,
        uint256 _purpose,
        uint256 _salt
    ) 
        private
    {
        bytes32 purposeSaltedHash = keccak256(_purpose, _salt); // salted accounts by purpose array index pointer   
        bytes32 saltedOldKeyPurposeHash = keccak256(oldKeySaltedHash, _purpose); // accounts by purpose hash element index pointer
        bytes32 saltedNewKeyPurposeHash = keccak256(newKeySaltedHash, _purpose); // accounts by purpose hash element index pointer
        bytes32 oldKeyPurposeSaltedHash = keccak256(_oldKey, _purpose, _salt); //account purpose array element index
        bytes32 newKeyPurposeSaltedHash = keccak256(_newKey, _purpose, _salt); //account purpose array element index

        delete isKeyPurpose[saltedOldKeyPurposeHash]; //clear oldKey auth
        isKeyPurpose[saltedNewKeyPurposeHash] = true; //set newKey auth
        
        uint256 replacedKeyElementIndex = indexes[saltedOldKeyPurposeHash];
        delete indexes[saltedOldKeyPurposeHash];
        keysByPurpose[purposeSaltedHash][replacedKeyElementIndex] = _newKey; //replace key at list by purpose
        indexes[saltedNewKeyPurposeHash] = replacedKeyElementIndex; // save index
        
        indexes[newKeyPurposeSaltedHash] = indexes[oldKeyPurposeSaltedHash]; //transfer key purposes list index
        delete indexes[oldKeyPurposeSaltedHash];
    }

    /**
     * @dev simply store the claim
     */
    function storeClaim(
        bytes32 _claimHash,
        uint256 _topic,
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
            topic: _topic,
            scheme: _scheme,
            issuer: _issuer,
            signature: _signature,
            data: _data,
            uri: _uri
            }
        );
        indexes[_claimHash] = claimsByType[_topic].length;
        claimsByType[_topic].push(_claimHash);
        emit ClaimAdded(
            _claimHash,
            _topic,
            _scheme,
            _issuer,
            _signature,
            _data,
            _uri
        );
    }

    /**
     * @dev update claim with new data
     */
    function updateClaim(
        bytes32 _claimHash,
        uint256 _topic,
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
            topic: _topic,
            scheme: _scheme,
            issuer: _issuer,
            signature: _signature,
            data: _data,
            uri: _uri
        });
        emit ClaimChanged(
            _claimHash,
            _topic,
            _scheme,
            _issuer,
            _signature,
            _data,
            _uri
        );
    }

    
}

