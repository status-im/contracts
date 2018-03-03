pragma solidity ^0.4.17;

import "./ERC725.sol";
import "./ERC735.sol";


contract Identity is ERC725, ERC735 {

    mapping (bytes32 => Key) keys;
    mapping (bytes32 => Claim) claims;
    mapping (uint256 => bytes32[]) keysByPurpose;
    mapping (uint256 => bytes32[]) claimsByType;
    mapping (bytes32 => uint256) indexes;
    mapping (uint => Transaction) txx;
    mapping (uint256 => uint256) minimumApprovalsByKeyPurpose;
    bytes32[] pendingTransactions;
    uint nonce = 0;
    address recoveryContract;
    address recoveryManager;

    struct Transaction {
        address to;
        uint value;
        bytes data;
        uint nonce;
        uint approverCount;
        mapping(bytes32 => bool) approvals;
    }

    modifier managerOnly {
        require(
            isKeyType(bytes32(msg.sender), MANAGEMENT_KEY)
        );
        _;
    }

    modifier selfOnly {
        require(
            msg.sender == address(this)
        );
        _;
    }

    modifier recoveryOnly {
        require(
            (recoveryContract != address(0) && msg.sender == address(recoveryContract))
        );
        _;
    }

    modifier actorOnly(bytes32 _key) {
        require(isKeyType(_key, ACTION_KEY));
        _;
    }
    
    modifier managerOrActor(bytes32 _key) {


        require(
            isKeyType(bytes32(msg.sender), MANAGEMENT_KEY) || 
            isKeyType(bytes32(msg.sender), ACTION_KEY)
        );
        _;
    }

    function Identity() public {
        _addKey(bytes32(msg.sender), MANAGEMENT_KEY, 0);

        minimumApprovalsByKeyPurpose[MANAGEMENT_KEY] = 1;
        minimumApprovalsByKeyPurpose[ACTION_KEY] = 1;
    }
    
    function managerReset(address _newKey) 
        external 
        recoveryOnly
    {
        recoveryManager = _newKey;
        _addKey(bytes32(recoveryManager), MANAGEMENT_KEY, 0);
        minimumApprovalsByKeyPurpose[MANAGEMENT_KEY] = keysByPurpose[MANAGEMENT_KEY].length;
    }
    
    function processManagerReset(uint256 limit) 
        public 
    {
        require(recoveryManager != address(0));
        bytes32 newKey = bytes32(recoveryManager);
        bytes32[] memory managers = keysByPurpose[MANAGEMENT_KEY];
        uint256 totalManagers = managers.length;
        
        if (limit == 0) {
            limit = totalManagers;
        }

        minimumApprovalsByKeyPurpose[MANAGEMENT_KEY] = totalManagers - limit + 1;
        for (uint256 i = 0; i < limit; i++) {
            bytes32 manager = managers[i];
            if (manager != newKey) {
                _removeKey(manager, MANAGEMENT_KEY);
                totalManagers--;
            }
        }

        if (totalManagers == 1) {
            recoveryManager = address(0);
        }
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

    function replaceKey(
        bytes32 _oldKey,
        bytes32 _newKey,
        uint256 _newType
    )
        public
        selfOnly
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
        managerOrActor(bytes32(msg.sender))
        returns (uint256 executionId)
    {
        executionId = _execute(_to, _value, _data);
        approve(executionId, true);
    }

    function approve(uint256 _id, bool _approval) 
        public 
        managerOrActor(bytes32(msg.sender))
        returns (bool success)
    {   
        return _approve(bytes32(msg.sender), _id, _approval);
    }

    function setMinimumApprovalsByKeyType(
        uint256 _purpose,
        uint256 _minimumApprovals
    ) 
        public 
        selfOnly
    {
        require(_minimumApprovals > 0);
        require(_minimumApprovals <= keysByPurpose[_purpose].length);
        minimumApprovalsByKeyPurpose[_purpose] = _minimumApprovals;
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
            require(_issuer == msg.sender);
            require(isKeyType(bytes32(msg.sender), CLAIM_SIGNER_KEY));
            _execute(address(this), 0, msg.data);
            ClaimRequested(
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
    
    function removeClaim(bytes32 _claimId) public returns (bool success) {
        Claim memory c = claims[_claimId];
        
        require(
            msg.sender == c.issuer ||
            msg.sender == address(this)
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
        returns(bytes32[])
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

    modifier validECDSAKey (
        bytes32 _key, 
        bytes32 _signHash, 
        uint8 _v, 
        bytes32 _r,
        bytes32 _s
    ) 
    {
        require(address(_key) == ecrecover(keccak256("\x19Ethereum Signed Message:\n32", _signHash), _v, _r, _s));
        require(keys[_key].purpose != 0);
        _;
    }

    function approveECDSA(
        uint256 _id,
        bool _approval,
        bytes32 _key, 
        uint8 _v, 
        bytes32 _r, 
        bytes32 _s
    ) 
        public 
        validECDSAKey(
            _key,
            keccak256(
                address(this),
                bytes4(keccak256("approve(uint256,bool)")),
                _id,
                _approval
                ),
            _v,
            _r,
            _s
        )
        managerOrActor(_key)
        returns (bool success)
    {   
        return _approve(_key, _id, _approval);
    }
    
    function executeECDSA(
        address _to,
        uint256 _value,
        bytes _data,
        uint _nonce,
        bytes32 _key, 
        uint8 _v, 
        bytes32 _r, 
        bytes32 _s
    ) 
        public 
        validECDSAKey(_key, keccak256(address(this), 
                      bytes4(keccak256("execute(address,uint256,bytes)")), 
                      _to, _value, _data, _nonce), _v, _r, _s)
        managerOrActor(_key)
        returns (uint256 executionId)
    {
        executionId = _execute(_to, _value, _data);
        _approve(_key, executionId, true);
    }

    function setupRecovery(address _recoveryContract) 
        public
        selfOnly
    {
        require(recoveryContract == address(0));
        recoveryContract = _recoveryContract;
    }

    function () public payable {

    }

    function _execute(
        address _to,
        uint256 _value,
        bytes _data
    ) 
        private
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
    }
    
    function _approve(
        bytes32 _key,
        uint256 _id,
        bool _approval
    ) 
        private 
        returns(bool success)
    {
        
        Transaction storage trx = txx[_id];
        
        uint256 approvalCount;
        uint256 requiredKeyPurpose;
        
        Approved(_id, _approval);

        if (trx.to == address(this)) {
            require(isKeyType(_key, MANAGEMENT_KEY));
            bytes32 managerKeyHash = keccak256(_key, MANAGEMENT_KEY);
            requiredKeyPurpose = MANAGEMENT_KEY;
            approvalCount = _calculateApprovals(managerKeyHash, _approval, trx);
        } else {
            require(isKeyType(_key, ACTION_KEY));
            bytes32 actorKeyHash = keccak256(_key, ACTION_KEY);
            requiredKeyPurpose = ACTION_KEY;
            approvalCount = _calculateApprovals(actorKeyHash, _approval, trx);
        }

        if (approvalCount >= minimumApprovalsByKeyPurpose[requiredKeyPurpose]) {
            Executed(_id, trx.to, trx.value, trx.data);
            success = trx.to.call.value(trx.value)(trx.data);
        }
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
            require(
                keysByPurpose[MANAGEMENT_KEY].length >= 1 && 
                keysByPurpose[MANAGEMENT_KEY].length >= minimumApprovalsByKeyPurpose[MANAGEMENT_KEY]
            );

        }

        delete keys[keyHash];
    }

    function _calculateApprovals(
        bytes32 _keyHash,
        bool _approval,
        Transaction storage trx
    )
        private 
        returns (uint256 approvalCount) 
    {
        require(trx.approvals[_keyHash] != _approval);

        trx.approvals[_keyHash] = _approval;
        if (_approval) {
            trx.approverCount++;
        } else {
            trx.approverCount--;
        }
        
        return trx.approverCount;
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
        ClaimAdded(
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
        ClaimChanged(
            _claimHash,
            _claimType,
            _scheme,
            _issuer,
            _signature,
            _data,
            _uri
            );
        claims[_claimHash] = Claim({
            claimType: _claimType,
            scheme: _scheme,
            issuer: _issuer,
            signature: _signature,
            data: _data,
            uri: _uri
        });
    }


}


