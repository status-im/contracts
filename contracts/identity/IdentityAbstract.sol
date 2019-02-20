pragma solidity >=0.5.0 <0.6.0;

import "../deploy/InstanceAbstract.sol";
import "../deploy/PrototypeRegistry.sol";
import "../common/Account.sol";
import "./ERC725.sol";
import "./ERC735.sol";

/**
 * @title IdentityAbstract
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 */
contract IdentityAbstract is InstanceAbstract, Account, ERC725, ERC735 {

    struct Transaction {
        uint256 approverCount;
        address to;
        uint256 value;
        bytes data;
        mapping(bytes32 => bool) approvals;
    }

    PrototypeRegistry prototypeRegistry;
    mapping(bytes4 => IdentityAbstract) extensions;
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
    
    
    modifier initialized {
        require(purposeThreshold[uint256(Purpose.ManagementKey)] > 0, "Unauthorized");
        _;
    }

    /**
     * @notice requires called by recovery address
     */
    modifier recoveryOnly {
        require(
            recoveryContract != address(0) && 
            msg.sender == recoveryContract,
            "Unauthorized"
        );
        _;
    }

    /**
     * @notice requires called by identity itself, otherwise forward to execute process
     */
    modifier managementOnly {
        if(msg.sender == address(this)) {
            _;
        } else {
            _requestExecute(keccak256(abi.encodePacked(msg.sender)), address(this), 0, msg.data);
        }
    }
    

    constructor() internal {}
    
    function _requestExecute(
        bytes32 _key,
        address _to,
        uint256 _value,
        bytes memory _data
    ) 
        internal 
        returns (uint256 txId)
    {
        Purpose requiredPurpose = _to == address(this) ? Purpose.ManagementKey : Purpose.ActionKey;
        require(_keyHasPurpose(_key, requiredPurpose), "Unauthorized");
        if (purposeThreshold[uint256(requiredPurpose)] == 1) {
            txId = _execute(_to, _value, _data);
        } else {
            txId = _requestApproval(_key, _to, _value, _data);
        } 
    }

    function _requestApproval(
        bytes32 _key,
        address _to,
        uint256 _value,
        bytes memory _data
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

    function _approveRequest(
        bytes32 _key,
        uint256 _txId,
        bool _approval
    ) 
        internal 
        returns(bool success) //(?) should return approved instead of success?
    {
        
        Transaction memory approvedTx = pendingTx[_txId];
        require(approvedTx.approverCount > 0 || approvedTx.to == address(this), "Unknown trasaction");
        Purpose requiredKeyPurpose = approvedTx.to == address(this) ? Purpose.ManagementKey : Purpose.ActionKey;
        require(_keyHasPurpose(_key, requiredKeyPurpose), "Unauthorized");
        require(pendingTx[_txId].approvals[_key] != _approval, "Bad call");
        
        if (_approval) {
            if (approvedTx.approverCount + 1 == purposeThreshold[uint256(requiredKeyPurpose)]) {
                delete pendingTx[_txId];
                emit Approved(_txId, _approval);
                _execute(approvedTx.to, approvedTx.value, approvedTx.data);
                success = true;
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
        Purpose _purpose,
        uint256 _type,
        uint256 _salt
    ) 
        internal
    {
        
        require(_key != 0, "Bad argument");
        require(_purpose != Purpose.DisabledKey, "Bad argument");
        bytes32 purposeSaltedHash = keccak256(abi.encodePacked(_purpose, _salt));
        bytes32 keySaltedHash = keccak256(abi.encodePacked(_key, _salt)); //key storage pointer
        bytes32 saltedKeyPurposeHash = keccak256(abi.encodePacked(keySaltedHash, _purpose)); // accounts by purpose hash element index pointer

        require(!isKeyPurpose[saltedKeyPurposeHash],"Bad call"); //cannot add a key already added
        isKeyPurpose[saltedKeyPurposeHash] = true; //set authorization
        uint256 keyElementIndex = keysByPurpose[purposeSaltedHash].push(_key) - 1; //add key to list by purpose 
        indexes[saltedKeyPurposeHash] = keyElementIndex; //save index of key in list by purpose
        if (keys[keySaltedHash].key == 0) { //is a new key
            Purpose[] memory purposes = new Purpose[](1);  //create new array with first purpose
            purposes[0] = _purpose;
            keys[keySaltedHash] = Key(purposes,_type,_key); //add new key
        } else {
            uint256 addedPurposeElementIndex = keys[keySaltedHash].purposes.push(_purpose) - 1; //add purpose to key
            bytes32 keyPurposeSaltedHash = keccak256(abi.encodePacked(_key, _purpose, _salt)); //index of purpose in key pointer
            indexes[keyPurposeSaltedHash] = addedPurposeElementIndex; //save index
        }
        
        emit KeyAdded(_key, _purpose, _type);
    }

    function _removeKey(
        bytes32 _key,
        Purpose _purpose,
        uint256 _salt
    )
        internal 
    {
        bytes32 keySaltedHash = keccak256(abi.encodePacked(_key, _salt)); // key storage pointer
        _removeKeyFromPurposes(keySaltedHash, _purpose, _salt);
        //remove key purposes array purpose element
        Key storage myKey = keys[keySaltedHash]; //load Key storage pointer
        uint256 _type = myKey.keyType; //save type for case key deleted
        uint256 replacerPurposeIndex = myKey.purposes.length; //load amount of purposes
        bytes32 keyPurposeSaltedHash = keccak256(abi.encodePacked(_key, _purpose, _salt)); //account purpose array element index
        uint256 removedPurposeIndex = indexes[keyPurposeSaltedHash]; //read old index
        delete indexes[keyPurposeSaltedHash]; //delete key's purpose index
        if (replacerPurposeIndex > 1) { //is not the last key
            replacerPurposeIndex--; //move to last element pos
            if(removedPurposeIndex != replacerPurposeIndex) { //removed element is not last element
                Purpose replacerPurpose = myKey.purposes[replacerPurposeIndex]; //take last element
                myKey.purposes[removedPurposeIndex] = replacerPurpose; //replace removed element with replacer element
                indexes[keccak256(abi.encodePacked(_key, replacerPurpose, _salt))] = removedPurposeIndex; //update index
            }
            myKey.purposes.length--; //remove last element
        } else { //is the last purpose
            delete keys[keySaltedHash]; //drop this Key 
        }
        
        emit KeyRemoved(_key, _purpose, _type);
    }

    function _removeKeyFromPurposes(
        bytes32 keySaltedHash,
        Purpose _purpose,
        uint256 _salt
    ) 
        internal
    {
        bytes32 purposeSaltedHash = keccak256(abi.encodePacked(_purpose, _salt)); // salted accounts by purpose array index pointer   
        // forbidden to remove last management key
        if (_purpose == Purpose.ManagementKey) {
            require(purposeThreshold[uint256(Purpose.ManagementKey)] <= keysByPurpose[purposeSaltedHash].length-1, "Bad call");
        }

        bytes32 saltedKeyPurposeHash = keccak256(abi.encodePacked(keySaltedHash, _purpose)); // accounts by purpose hash element index pointer
        require(isKeyPurpose[saltedKeyPurposeHash], "Unknown key"); //not possible to remove what not exists
        delete isKeyPurpose[saltedKeyPurposeHash]; //remove authorization

        // remove keys by purpose array key element
        uint256 removedKeyIndex = indexes[saltedKeyPurposeHash]; // read old key element index
        delete indexes[saltedKeyPurposeHash]; // delete key index
        
        uint256 replacerKeyIndex = keysByPurpose[purposeSaltedHash].length - 1; // replacer is last element
        if (removedKeyIndex != replacerKeyIndex) {  // deleted not the last element, replace deleted by last element
            bytes32 replacerKey = keysByPurpose[purposeSaltedHash][replacerKeyIndex]; // get replacer key 
            keysByPurpose[purposeSaltedHash][removedKeyIndex] = replacerKey; // overwrite removed index by replacer
            indexes[keccak256(abi.encodePacked(keccak256(abi.encodePacked(replacerKey, _salt)), _purpose))] = removedKeyIndex; // update saltedKeyPurposeHash index of replacer
        }
        keysByPurpose[purposeSaltedHash].length--; // remove last element
    }
    
    /**
     * @notice Replaces one `_oldKey` with other `_newKey`
     * @param _oldKey key to remove
     * @param _newKey key to add
     * @param _newType inform type of `_newKey`
     * @param _salt current salt
     */
    function _replaceKey(
        bytes32 _oldKey,
        bytes32 _newKey,
        uint256 _newType,
        uint256 _salt
    )
        internal
        returns (bool success)
    {   
        bytes32 newKeySaltedHash = keccak256(abi.encodePacked(_newKey, _salt)); // key storage pointer     
        if (_oldKey == _newKey) { //not replacing key, just keyType
            keys[newKeySaltedHash].keyType == _newType; 
            return true;
        }
        bytes32 oldKeySaltedHash = keccak256(abi.encodePacked(_oldKey, _salt)); // key storage pointer     
        Key memory oldKey = keys[oldKeySaltedHash];
        delete keys[oldKeySaltedHash];
        uint256 len = oldKey.purposes.length;
        for (uint i = 0; i < len; i++) {
            _replaceKeyPurpose(oldKeySaltedHash, oldKeySaltedHash, _oldKey, _newKey, oldKey.purposes[i], _salt);
        }
        keys[newKeySaltedHash] = Key(oldKey.purposes, _newType, _newKey); //add new key
        return true;
    } 

    function _replaceKeyPurpose(
        bytes32 newKeySaltedHash,
        bytes32 oldKeySaltedHash,
        bytes32 _oldKey,
        bytes32 _newKey,
        Purpose _purpose,
        uint256 _salt
    ) 
        internal
    {
        bytes32 purposeSaltedHash = keccak256(abi.encodePacked(_purpose, _salt)); // salted accounts by purpose array index pointer   
        bytes32 saltedOldKeyPurposeHash = keccak256(abi.encodePacked(oldKeySaltedHash, _purpose)); // accounts by purpose hash element index pointer
        bytes32 saltedNewKeyPurposeHash = keccak256(abi.encodePacked(newKeySaltedHash, _purpose)); // accounts by purpose hash element index pointer
        bytes32 oldKeyPurposeSaltedHash = keccak256(abi.encodePacked(_oldKey, _purpose, _salt)); //account purpose array element index
        bytes32 newKeyPurposeSaltedHash = keccak256(abi.encodePacked(_newKey, _purpose, _salt)); //account purpose array element index

        delete isKeyPurpose[saltedOldKeyPurposeHash]; //clear oldKey auth
        isKeyPurpose[saltedNewKeyPurposeHash] = true; //set newKey auth
        
        uint256 replacedKeyElementIndex = indexes[saltedOldKeyPurposeHash];
        delete indexes[saltedOldKeyPurposeHash];
        keysByPurpose[purposeSaltedHash][replacedKeyElementIndex] = _newKey; //replace key at list by purpose
        indexes[saltedNewKeyPurposeHash] = replacedKeyElementIndex; // save index
        
        indexes[newKeyPurposeSaltedHash] = indexes[oldKeyPurposeSaltedHash]; //transfer key purposes list index
        delete indexes[oldKeyPurposeSaltedHash];
    }

    function _includeClaim(
        bytes32 _claimHash,
        uint256 _topic,
        uint256 _scheme,
        address _issuer,
        bytes memory _signature,
        bytes memory _data,
        string memory _uri
    ) 
        internal
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

    function _modifyClaim(
        bytes32 _claimHash,
        uint256 _topic,
        uint256 _scheme,
        address _issuer,
        bytes memory _signature,
        bytes memory _data,
        string memory _uri
    ) 
        internal
    {
        require(msg.sender == _issuer, "Unauthorized");
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

    function _keyHasPurpose(bytes32 _key, Purpose _purpose) 
        internal
        view 
        returns (bool exists) 
    {
        return isKeyPurpose[keccak256(abi.encodePacked(keccak256(abi.encodePacked(_key, salt)), _purpose))];
    }
   
}

