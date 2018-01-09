pragma solidity ^0.4.17;

contract ERC725 {

    uint256 constant MANAGEMENT_KEY = 1;
    uint256 constant ACTION_KEY = 2;
    uint256 constant CLAIM_SIGNER_KEY = 3;
    uint256 constant ENCRYPTION_KEY = 4;

    event KeyAdded(address indexed key, uint256 indexed keyType);
    event KeyRemoved(address indexed key, uint256 indexed keyType);
    event KeyReplaced(address indexed oldKey, address indexed newKey, uint256 indexed keyType);
    event ExecutionRequested(bytes32 indexed executionId, address indexed to, uint256 indexed value, bytes data);
    event Executed(bytes32 indexed executionId, address indexed to, uint256 indexed value, bytes data);
    event Approved(bytes32 indexed executionId, bool approved);

    function getKeyType(address _key) public constant returns(uint256 keyType);
    function getKeysByType(uint256 _type) public constant returns(address[]);
    function addKey(address _key, uint256 _type) public returns (bool success);
    function removeKey(address _key) public returns (bool success);
    function replaceKey(address _oldKey, address _newKey) public returns (bool success);
    function execute(address _to, uint256 _value, bytes _data) public returns (bytes32 executionId);
    function approve(bytes32 _id, bool _approve) public returns (bool success);
}