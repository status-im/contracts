pragma solidity ^0.4.21;

import "./ERC725.sol";
import "./ERC735.sol";
import "../common/MessageSigned.sol";

contract Identity is ERC725, ERC735, MessageSigned {

    mapping (bytes32 => Key) keys;
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
    
    modifier msgSenderKey(uint256 keyPurpose) {
        if(msg.sender == address(this)) {
            _;
        } else {
            require(isKeyPurpose(keccak256(msg.sender), keyPurpose));
            if (purposeThreshold[keyPurpose] == 1) {
                _;
            } else {
                execute(address(this), 0, msg.data);
            }
        }
    }

    modifier recoveryOnly {
        require(
            recoveryContract != address(0) && 
            msg.sender == recoveryContract
        );
        _;
    }
    
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
        require(keys[_key].purpose != 0);
        _;
    }

    constructor() public {
        _constructIdentity(keccak256(msg.sender));
    }    

    function () 
        public 
        payable 
    {

    }

    ////////////////
    // Execute calls and multisig approval
    ////////////////

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

    function approve(uint256 _id, bool _approval) 
        public 
        returns (bool success)
    {   
        return _approveRequest(keccak256(msg.sender), _id, _approval);
    }

    ////////////////
    // Message Signed functions
    ////////////////
    
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
        txId = _execute(_key, _to, _value, _data);
    }

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

    function addKey(
        bytes32 _key,
        uint256 _purpose,
        uint256 _type
    )
        public
        msgSenderKey(MANAGEMENT_KEY)
        returns (bool success)
    {   
        _addKey(_key, _purpose, _type);
        return true;
    }

    function replaceKey(
        bytes32 _oldKey,
        bytes32 _newKey,
        uint256 _newType
    )
        public
        msgSenderKey(MANAGEMENT_KEY)
        returns (bool success)
    {
        uint256 purpose = keys[_oldKey].purpose;
        _addKey(_newKey, purpose, _newType);
        _removeKey(_oldKey, purpose);
        return true;
    } 

    function removeKey(
        bytes32 _key,
        uint256 _purpose
    )
        public
        msgSenderKey(MANAGEMENT_KEY)
        returns (bool success)
    {
        _removeKey(_key, _purpose);
        return true;
    }

    function setMinimumApprovalsByKeyType(
        uint256 _purpose,
        uint256 _minimumApprovals
    ) 
        public 
        msgSenderKey(MANAGEMENT_KEY)
    {
        require(_minimumApprovals > 0);
        require(_minimumApprovals <= keysByPurpose[_purpose].length);
        purposeThreshold[_purpose] = _minimumApprovals;
    }
    
    function setupRecovery(address _recoveryContract) 
        public
        msgSenderKey(MANAGEMENT_KEY)
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
            require(isKeyPurpose(keccak256(msg.sender), CLAIM_SIGNER_KEY));
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

    function managerReset(bytes32 _newKey) 
        public 
        recoveryOnly
    {
        recoveryManager = _newKey;
        _addKey(keccak256(recoveryManager), MANAGEMENT_KEY, 0);
        purposeThreshold[MANAGEMENT_KEY] = keysByPurpose[MANAGEMENT_KEY].length;
    }
    
    function processManagerReset(uint256 _limit) 
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
        returns(uint256 purpose, uint256 keyType, bytes32 key) 
    {
        Key storage myKey = keys[keccak256(_key, _purpose)];
        return (myKey.purpose, myKey.keyType, myKey.key);
    }
    
    function isKeyPurpose(bytes32 _key, uint256 _purpose) 
        public
        view 
        returns (bool)
    {
        return keys[keccak256(_key, _purpose)].purpose == _purpose;
    }

    function getKeyPurpose(bytes32 _key)
        public 
        view 
        returns(uint256[] purpose)
    {
        
        uint256[] memory purposeHolder = new uint256[](4);
        uint8 counter = 0;
        
        if (isKeyPurpose(_key, MANAGEMENT_KEY)) {
            purposeHolder[counter] = MANAGEMENT_KEY;
            counter++;
        }
        
        if (isKeyPurpose(_key, ACTION_KEY)) {
            purposeHolder[counter] = ACTION_KEY;
            counter++;
        }
            
        if (isKeyPurpose(_key, CLAIM_SIGNER_KEY)) {
            purposeHolder[counter] = CLAIM_SIGNER_KEY;
            counter++;
        }
            
        if (isKeyPurpose(_key, ENCRYPTION_KEY)) {
            purposeHolder[counter] = ENCRYPTION_KEY;
            counter++;
        }
        
        uint256[] memory result = new uint256[](counter);
        for (uint8 i = 0; i < counter; i++) {
            result[i] = purposeHolder[i];
        }
        
        return result;
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
        require(isKeyPurpose(_key, requiredPurpose));
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
        require(isKeyPurpose(_key, requiredKeyPurpose));
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
        bytes32 keyHash = keccak256(_key, _purpose);
        require(keys[keyHash].purpose == 0);
        keys[keyHash] = Key(_purpose, _type, _key);
        indexes[keyHash] = keysByPurpose[_purpose].push(_key) - 1;
        emit KeyAdded(_key, _purpose, _type);
    }

    function _removeKey(
        bytes32 _key,
        uint256 _purpose
    )
        private 
    {
        if (_purpose == MANAGEMENT_KEY) {
            require(keysByPurpose[MANAGEMENT_KEY].length > purposeThreshold[MANAGEMENT_KEY]);
        }

        bytes32 keyHash = keccak256(_key, _purpose);
        Key memory myKey = keys[keyHash];
        uint256 index = indexes[keyHash];
        bytes32 indexReplacer = keysByPurpose[_purpose][keysByPurpose[_purpose].length - 1];
        
        keysByPurpose[_purpose][index] = indexReplacer;
        indexes[keccak256(indexReplacer, _purpose)] = index;
        keysByPurpose[_purpose].length--;

        delete indexes[keyHash];
        delete keys[keyHash];

        emit KeyRemoved(myKey.key, myKey.purpose, myKey.keyType);
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

