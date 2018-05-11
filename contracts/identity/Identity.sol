pragma solidity ^0.4.21;

import "./ERC725.sol";
import "./ERC735.sol";
import "../common/MessageSigned.sol";

/**
 * @title Self sovereign Identity
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 */
contract Identity is ERC725, ERC735, MessageSigned {

    uint256 public nonce; 
    address public recoveryContract;
    uint256 salt;

    mapping (bytes32 => uint256) indexes;

    mapping (bytes32 => Key) keys;
    mapping (bytes32 => bool) isKeyPurpose;
    mapping (bytes32 => bytes32[]) keysByPurpose;

    mapping (uint256 => Transaction) pendingTx;
    mapping (uint256 => uint256) purposeThreshold;

    mapping (bytes32 => Claim) claims;
    mapping (uint256 => bytes32[]) claimsByType;
    
    struct Transaction {
        uint256 approverCount;
        address to;
        uint256 value;
        bytes data;
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
                ),
                salt
            )                    
        );
        _;
    }

    /**
     * @notice constructor builds identity with first key as `msg.sender`
     */
    constructor(bytes32 _key) public {
        _constructIdentity(_key);
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
     * @param _nonce current nonce
     * @param _key key authorizing the call
     * @param _signature signature of key
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
        returns (uint256 txId)
    {
        require(_nonce == nonce);
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
        uint256 _txId,
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
                _txId,
                _approval
                ),
            _signature
        )
        returns (bool success)
    {   
        return _approveRequest(_key, _txId, _approval);
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
        _addKey(_key, _purpose, _type, salt);
        return true;
    }

    /**
     * @notice Replaces one `_oldKey` with other `_recoveryNewKey`
     * @param _purpose what purpose being replaced
     * @param _oldKey key to remove
     * @param _recoveryNewKey key to add
     * @param _newType inform type of `_recoveryNewKey`
     */
    function replaceKey(
        uint256 _purpose,
        bytes32 _oldKey,
        bytes32 _recoveryNewKey,
        uint256 _newType
    )
        public
        managementOnly
        returns (bool success)
    {
        _addKey(_recoveryNewKey, _purpose, _newType, salt);
        _removeKey(_oldKey, _purpose, salt);
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
        _removeKey(_key, _purpose, salt);
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
            _requestApproval(0, address(this), 0, msg.data);
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

    /** 
     * @notice Increase salt for hashing storage pointer of keys and add `_recoveryNewKey` 
     * @param _recoveryNewKey new key being defined
     */
    function recoveryReset(bytes32 _recoveryNewKey) 
        public 
        recoveryOnly
    {
        salt++;
        _addKey(_recoveryNewKey, MANAGEMENT_KEY, 0, salt);
        _addKey(_recoveryNewKey, ACTION_KEY, 0, salt);
        purposeThreshold[MANAGEMENT_KEY] = 1;
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
        Key storage myKey = keys[keccak256(_key, salt)];
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
        return keys[keccak256(_key, salt)].purposes;
    }
    
    function getKeysByPurpose(uint256 _purpose)
        public
        view
        returns(bytes32[])
    {
        return keysByPurpose[keccak256(_purpose, salt)];
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
        uint256 _salt = salt;
        require(keysByPurpose[keccak256(MANAGEMENT_KEY, _salt)].length == 0);
        require(purposeThreshold[MANAGEMENT_KEY] == 0);
        _addKey(_managerKey, MANAGEMENT_KEY, 0, _salt);
        _addKey(_managerKey, ACTION_KEY, 0, _salt);

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
            txId = nonce++;
            _commitCall(txId, _to, _value, _data);
        } else {
            txId = _requestApproval(_key, _to, _value, _data);
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
        success = _to.call.value(_value)(_data);
        if (success) {
            emit Executed(_txId, _to, _value, _data); 
        } else {
            emit ExecutionFailed(_txId, _to, _value, _data);
        }
    }

    function _requestApproval(
        bytes32 _key,
        address _to,
        uint256 _value,
        bytes _data
    )
        internal 
        returns (uint256 txId)
    {
        txId = nonce++;
        
        pendingTx[txId] = Transaction({
            approverCount: _key == 0 ? 0 : 1,
            to: _to,
            value: _value,
            data: _data
        });
        
        if (_key != 0) {
            pendingTx[txId].approvals[_key] = true;
        }

        emit ExecutionRequested(txId, _to, _value, _data);
    }

    ////////////////
    // Private methods
    ////////////////

    function _approveRequest(
        bytes32 _key,
        uint256 _txId,
        bool _approval
    ) 
        private 
        returns(bool success) //(?) should return approved instead of success?
    {
        
        Transaction memory approvedTx = pendingTx[_txId];
        require(approvedTx.approverCount > 0);
        uint256 requiredKeyPurpose = approvedTx.to == address(this) ? MANAGEMENT_KEY : ACTION_KEY;
        require(hasKeyPurpose(_key, requiredKeyPurpose));
        require(pendingTx[_txId].approvals[_key] != _approval);
        
        if (_approval) {
            if (approvedTx.approverCount + 1 == purposeThreshold[requiredKeyPurpose]) {
                delete pendingTx[_txId];
                emit Approved(_txId, _approval);
                return _commitCall(_txId, approvedTx.to, approvedTx.value, approvedTx.data);
            } else {
                pendingTx[_txId].approvals[_key] = true;
                pendingTx[_txId].approverCount++;
            }
        } else {
            delete pendingTx[_txId].approvals[_key];
            if (pendingTx[_txId].approverCount == 1) {
                delete pendingTx[_txId];
                emit Approved(_txId, _approval);
            } else {
                pendingTx[_txId].approverCount--;
            }
        }
    }

    function _addKey(
        bytes32 _key,
        uint256 _purpose,
        uint256 _type,
        uint256 _salt
    ) 
        private
    {
        require(_purpose > 0);
        
        bytes32 keySaltedHash = keccak256(_key, _salt); //key storage pointer
        bytes32 saltedKeyPurposeHash = keccak256(keySaltedHash, _purpose); // accounts by purpose hash element index pointer

        require(!isKeyPurpose[saltedKeyPurposeHash]); //cannot add a key already added
        isKeyPurpose[saltedKeyPurposeHash] = true; //set authorization
        uint256 keyElementIndex = keysByPurpose[saltedKeyPurposeHash].push(_key) - 1; //add key to list by purpose 
        indexes[saltedKeyPurposeHash] = keyElementIndex; //save index of key in list by purpose
        if (keys[keySaltedHash].key == 0) { //is a new key
            uint256[] memory purposes = new uint256[](_purpose);  //create new array with first purpose
            keys[keySaltedHash] = Key(purposes,_type,_key); //add new key
        } else {
            uint256 addedPurposeElementIndex = keys[keySaltedHash].purposes.push(_purpose) - 1; //add purpose to key
            bytes32 keyPurposeSaltedHash = keccak256(_key, _purpose, _salt); //index of purpose in key pointer
            indexes[keyPurposeSaltedHash] = addedPurposeElementIndex; //save index
        }
        
        emit KeyAdded(_key, _purpose, _type);
    }
    
    
    function _removeKey(
        bytes32 _key,
        uint256 _purpose,
        uint256 _salt
    )
        private 
    {
        bytes32 purposeSaltedHash = keccak256(_purpose, _salt); // salted accounts by purpose array index pointer   
        // forbidden to remove last management key
        if (_purpose == MANAGEMENT_KEY) {
            require(keysByPurpose[purposeSaltedHash].length > purposeThreshold[MANAGEMENT_KEY]);
        }

        bytes32 keySaltedHash = keccak256(_key, _salt); // key storage pointer
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

