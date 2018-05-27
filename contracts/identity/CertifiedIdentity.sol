pragma solidity ^0.4.23;

import "./ERC725.sol";
import "../common/MessageSigned.sol";

/**
 * @title Self sovereign Identity
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 */
contract CertifiedIdentity is ERC725, MessageSigned {

    uint256 public nonce;

    mapping (bytes32 => Key) keys;
    mapping (uint256 => Transaction) pendingTx;
    
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
        require(address(_key) == recoverAddress(getSignHash(_messageHash), _signature));
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
     */

    constructor(   
        bytes32[] _keys,
        uint256[] _purposes,
        uint256[] _types,
        uint256 _managerThreshold,
        uint256 _actorThreshold
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

        uint len = initKeys.length;
        require(len > 0);
        for(uint i = 0; i < len; i++) {
            _addKey(initKeys[i], initPurposes[i], initTypes[i]);
        }
    }    

    /**
     * @notice default function allows deposit of ETH
     */
    function () public payable {}

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
            keccak256(address(this), bytes4(keccak256("execute(address,uint256,bytes)")), _to, _value, _data, _nonce),
            _signature
        )
        returns (uint256 txId)
    {
        require(_nonce == nonce);
        txId = _execute(_key, _to, _value, _data);
        
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
        uint256 _type = keys[_key].keyType;
        delete keys[_key]; //drop this Key 
        emit KeyRemoved(_key, _purpose, _type);
        return true;
    }
    
 
    ////////////////
    // Public Views
    ////////////////

    function getKey(bytes32 _key) 
        public 
        view 
        returns(uint256[] purposes, uint256 keyType, bytes32 key) 
    {
        Key storage myKey = keys[_key];
        return (myKey.purposes, myKey.keyType, myKey.key);
    }

    function getKeyPurpose(bytes32 _key)
        public 
        view 
        returns(uint256[] purpose)
    {
        return keys[_key].purposes;
    }

    function approve(uint256 _id, bool _approve) public returns (bool success) { return true; }
    function getKeysByPurpose(uint256 _purpose) public view returns(bytes32[] k) { 
        bytes32[] memory _keys = new bytes32[](1);
        _keys[0] = keys[0].key;
        return _keys;
    }
    function keyHasPurpose(bytes32 _key, uint256 purpose) public view returns(bool exists){ return false; }


    ////////////////
    // Internal methods
    ////////////////

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
        require(keyHasPurpose(_key, requiredPurpose));
        txId = nonce++;
        _commitCall(txId, _to, _value, _data); 
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

    ////////////////
    // Private methods
    ////////////////

    function _addKey(
        bytes32 _key,
        uint256 _purpose,
        uint256 _type
    ) 
        private
    {
        require(_key != 0);
        require(_purpose != 0);
        uint256[] memory purposes = new uint256[](1);
        purposes[0] = _purpose;
        keys[0] = Key(purposes,_type,_key); //add new key
        emit KeyAdded(_key, _purpose, _type);
    }

}