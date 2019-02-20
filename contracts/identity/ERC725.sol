pragma solidity >=0.5.0 <0.6.0;
interface ERC725 {
    event KeyAdded(bytes32 indexed key, Purpose indexed purpose, uint256 indexed keyType);
    event KeyRemoved(bytes32 indexed key, Purpose indexed purpose, uint256 indexed keyType);
    event ExecutionRequested(uint256 indexed executionId, address indexed to, uint256 indexed value, bytes data);
    event Approved(uint256 indexed executionId, bool approved);

    enum Purpose { DisabledKey, ManagementKey, ActionKey, ClaimSignerKey, EncryptionKey }
    struct Key {
        Purpose[] purposes; 
        uint256 keyType; // e.g. 1 = ECDSA, 2 = RSA, etc.
        bytes32 key;
    }

    function execute(address _to, uint256 _value, bytes calldata _data) external returns (uint256 executionId);
    function approve(uint256 _id, bool _approve) external returns (bool success);
    function addKey(bytes32 _key, Purpose _purpose, uint256 _keyType) external returns (bool success);
    function removeKey(bytes32 _key, Purpose _purpose) external returns (bool success);
    function getKey(bytes32 _key) external view returns(Purpose[] memory purposes, uint256 keyType, bytes32 key);
    function getKeyPurpose(bytes32 _key) external view returns(Purpose[] memory purpose);
    function getKeysByPurpose(Purpose _purpose) external view returns(bytes32[] memory keys);
    function keyHasPurpose(bytes32 _key, Purpose purpose) external view returns(bool exists);
}