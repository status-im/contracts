pragma solidity ^0.4.17;

import "./ERC725.sol";
import "./ERC735.sol";
import "./Recovery.sol";

contract Identity is ERC725, ERC735 {

    mapping (bytes32 => Key) keys;
    mapping (bytes32 => Claim) claims;
    mapping (uint256 => bytes32[]) keysByPurpose;
    mapping (uint256 => bytes32[]) claimsByType;
    mapping (bytes32 => uint256) indexes;
    mapping (uint => Transaction) txx;
    mapping (uint256 => uint8) minimumApprovalsByKeyType;
    bytes32[] pendingTransactions;
    uint nonce = 0;
    bool recoverySet;
    Recovery recoveryContract;

    struct Transaction {
        address to;
        uint value;
        bytes data;
        uint nonce;
        uint approverCount;
        mapping(uint256 => uint8) approvalsByKeyType;
        mapping(bytes32 => bool) approvals;
    }

    modifier managerOnly {
        require(isKeyType(bytes32(msg.sender), MANAGEMENT_KEY));
        _;
    }

    modifier selfOnly {
        require(msg.sender == address(this));
        _;
    }

    modifier actorOnly {
        require(isKeyType(bytes32(msg.sender), ACTION_KEY));
        _;
    }

    modifier claimSignerOnly {
        require(isKeyType(bytes32(msg.sender), CLAIM_SIGNER_KEY));
        _;
    }
    
    modifier managerOrActor {
        require(
            isKeyType(bytes32(msg.sender), MANAGEMENT_KEY) || 
            isKeyType(bytes32(msg.sender), ACTION_KEY)
        );
        _;
    }

    function Identity() public {
        _addKey(bytes32(msg.sender), MANAGEMENT_KEY, 1);
        minimumApprovalsByKeyType[MANAGEMENT_KEY] = 1;
    }

    function addKey(
        bytes32 _key,
        uint256 _purpose,
        uint256 _type
    )
        public
        selfOnly
        returns (bool success)
    {
        _addKey(_key, _purpose, _type);
        return true;
    }

    function removeKey(
        bytes32 _key,
        uint256 _purpose
    )
        public
        selfOnly
        returns (bool success)
    {
        _removeKey(_key, _purpose);
        return true;
    }

    function execute(
        address _to,
        uint256 _value,
        bytes _data
    ) 
        public 
        managerOrActor
        returns (uint256 executionId)
    {
        executionId = nonce;
        ExecutionRequested(executionId, _to, _value, _data);
        txx[executionId] = Transaction(
                            {
                                to: _to,
                                value: _value,
                                data: _data,
                                nonce: nonce,
                                approverCount: 0
                            });            
        nonce++;
        approve(executionId, true);
    }

    function approve(uint256 _id, bool _approve) 
        public 
        managerOrActor
        returns (bool success)
    {   
        Transaction storage trx = txx[_id];
        
        bytes32 managerKeyHash = keccak256(bytes32(msg.sender), MANAGEMENT_KEY);
        bytes32 actorKeyHash = keccak256(bytes32(msg.sender), ACTION_KEY);
        
        uint8 approvalCount;
        uint256 requiredKeyType;
        
        if (trx.to == address(this)) {
            requiredKeyType = MANAGEMENT_KEY;
            if (keys[managerKeyHash].purpose == MANAGEMENT_KEY) {
                approvalCount = _calculateApprovals(managerKeyHash, MANAGEMENT_KEY, _approve, trx);
            }
        } else {
            requiredKeyType = ACTION_KEY;
            if (keys[managerKeyHash].purpose == ACTION_KEY) {
                approvalCount = _calculateApprovals(actorKeyHash, ACTION_KEY, _approve, trx);
            }
        }
        
        if (approvalCount >= minimumApprovalsByKeyType[requiredKeyType]) {
            success = trx.to.call.value(txx[_id].value)(txx[_id].data);
        }
        
    }

    function setMiminumApprovalsByKeyType(
        uint256 _type,
        uint8 _minimumApprovals
    ) 
        public 
        selfOnly
    {
        minimumApprovalsByKeyType[_type] = _minimumApprovals;
    }

    function _calculateApprovals(
        bytes32 _keyHash,
        uint256 _keyType,
        bool _approve,
        Transaction storage trx
    )
        private 
        returns (uint8 approvalCount) 
    {
        if (trx.approvals[_keyHash] == false && _approve) {
            trx.approvalsByKeyType[_keyType]++;
        } else if (trx.approvals[_keyHash] == true && !_approve && trx.approverCount > 0) {
            trx.approvalsByKeyType[_keyType]--;
        }
        trx.approvals[_keyHash] = _approve;
        trx.approverCount++;
        return trx.approvalsByKeyType[_keyType];
    }

    function addClaim(
        uint256 _claimType,
        uint256 _scheme,
        address _issuer,
        bytes _signature,
        bytes _data,
        string _uri
    ) 
        public 
        claimSignerOnly
        returns (bytes32 claimRequestId)
    {
        
        bytes32 claimHash = keccak256(_issuer, _claimType);
        
        claimRequestId = claimHash;
        
        if (claims[claimHash].claimType > 0) {
            // Claim existed
            ClaimChanged(
                claimRequestId,
                _claimType,
                _scheme,
                _issuer,
                _signature,
                _data,
                _uri);
        } else {
            // TODO Triggers if the claim is new Event and approval process exists: ClaimRequested
            ClaimRequested(
                claimRequestId,
                _claimType,
                _scheme,
                _issuer,
                _signature,
                _data,
                _uri);
        }
        
        claims[claimHash] = Claim(
            {
                claimType: _claimType,
                scheme: _scheme,
                issuer: _issuer,
                signature: _signature,
                data: _data,
                uri: _uri
            }
        );
        
        indexes[claimHash] = claimsByType[_claimType].length;
        
        claimsByType[_claimType].push(claimRequestId);
        
        // TODO This SHOULD create a pending claim, which SHOULD to be approved or rejected by n of m approve calls from keys of purpose 1.
    }
    
    function removeClaim(bytes32 _claimId) public returns (bool success) {
        Claim memory c = claims[_claimId];
        
        require(
            msg.sender == c.issuer ||
            msg.sender == address(this) ||
            isKeyType(bytes32(msg.sender), MANAGEMENT_KEY)
            );
        
        // MUST only be done by the issuer of the claim, or KEYS OF PURPOSE 1, or the identity itself.
        // TODO If its the identity itself, the approval process will determine its approval.
        
        uint claimIdTypePos = indexes[_claimId];
        delete indexes[_claimId];
        bytes32[] storage claimsTypeArr = claimsByType[c.claimType];
        bytes32 replacer = claimsTypeArr[claimsTypeArr.length-1];
        claimsTypeArr[claimIdTypePos] = replacer;
        indexes[replacer] = claimIdTypePos;
        delete claims[_claimId];
        claimsTypeArr.length--;
        return true;
    }

    function _addKey(bytes32 _key, uint256 _purpose, uint256 _type) private {
        bytes32 keyHash = keccak256(_key, _purpose);
        
        require(keys[keyHash].purpose == 0);
        require(
            _purpose == MANAGEMENT_KEY ||
            _purpose == ACTION_KEY ||
            _purpose == CLAIM_SIGNER_KEY ||
            _purpose == ENCRYPTION_KEY
            );
        KeyAdded(_key, _purpose, _type);
        keys[keyHash] = Key(_purpose, _type, _key);
        indexes[keyHash] = keysByPurpose[_purpose].push(_key) - 1;
    }

    function _removeKey(bytes32 _key, uint256 _purpose) private {
        bytes32 keyHash = keccak256(_key, _purpose);
        Key storage myKey = keys[keyHash];
        KeyRemoved(myKey.key, myKey.purpose, myKey.keyType);
        
        uint index = indexes[keyHash];
        delete indexes[keyHash];
        bytes32 replacer = keysByPurpose[_purpose][keysByPurpose[_purpose].length - 1];
        keysByPurpose[_purpose][index] = replacer;
        indexes[keccak256(replacer, _purpose)] = index;
        keysByPurpose[_purpose].length--;

        if (_purpose == MANAGEMENT_KEY) {
            require(keysByPurpose[MANAGEMENT_KEY].length >= 1);
        }

        delete keys[keyHash];
        
        // MUST only be done by keys of purpose 1, or the identity itself.
        // TODO If its the identity itself, the approval process will determine its approval.
    }

    function getKey(
        bytes32 _key,
        uint256 _purpose
    ) 
        public 
        constant 
        returns(uint256 purpose, uint256 keyType, bytes32 key) 
    {
        Key storage myKey = keys[keccak256(_key, _purpose)];
        return (myKey.purpose, myKey.keyType, myKey.key);
    }
    
    function isKeyType(bytes32 _key, uint256 _type) 
        public
        constant 
        returns (bool)
    {
        return keys[keccak256(_key, _type)].purpose == _type;
    }

    function getKeyPurpose(bytes32 _key)
        public 
        constant 
        returns(uint256[] purpose)
    {
        
        uint256[] memory purposeHolder = new uint256[](4);
        uint8 counter = 0;
        
        if (isKeyType(_key, MANAGEMENT_KEY)) {
            purposeHolder[counter] = MANAGEMENT_KEY;
            counter++;
        }
        
        if (isKeyType(_key, ACTION_KEY)) {
            purposeHolder[counter] = ACTION_KEY;
            counter++;
        }
            
        if (isKeyType(_key, CLAIM_SIGNER_KEY)) {
            purposeHolder[counter] = CLAIM_SIGNER_KEY;
            counter++;
        }
            
        if (isKeyType(_key, ENCRYPTION_KEY)) {
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
        constant
        returns(bytes32[] keys)
    {
        return keysByPurpose[_purpose];
    }
    
    function getClaim(bytes32 _claimId)
        public
        constant 
        returns(uint256 claimType, uint256 scheme, address issuer, bytes signature, bytes data, string uri) 
    {
        Claim memory _claim = claims[_claimId];
        return (_claim.claimType, _claim.scheme, _claim.issuer, _claim.signature, _claim.data, _claim.uri);
    }
    
    function getClaimIdsByType(uint256 _claimType)
        public
        constant
        returns(bytes32[] claimIds)
    {
        return claimsByType[_claimType];
    }

// ---- Recovery Specific Functions
    event RecoverySetUp(address sender, bytes32[] recoveryHashes);
    event RecoveryCompleted(bytes32 newManagementKey);

    function setupRecovery(bytes32[] _recoveryHashes) 
        public
        managerOnly
    {
        require(recoverySet == false);
        RecoverySetUp(msg.sender, _recoveryHashes);
        recoveryContract = new Recovery(this, _recoveryHashes);
        recoverySet = true;
    }

    function completeRecovery() public {
        require(recoverySet == true);
        address newManager = recoveryContract.getNewManager();
        require(newManager != address(0x0));

        RecoveryCompleted(bytes32(newManager));
        
        bytes32[] memory managementKeys = getKeysByPurpose(MANAGEMENT_KEY);
        for (uint256 i = 0; i < managementKeys.length; i++) {
            _removeKey(managementKeys[i], MANAGEMENT_KEY);
        }
        addKey(bytes32(newManager), MANAGEMENT_KEY, 1);
        setMiminumApprovalsByKeyType(MANAGEMENT_KEY, 1);
    }



}


