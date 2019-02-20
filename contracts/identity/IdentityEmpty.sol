pragma solidity >=0.5.0 <0.6.0;

import "./IdentityAbstract.sol";

/**
 * @title IdentityEmpty
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @dev Implement all IdentityAbstract methods with no behavior
 */
contract IdentityEmpty is IdentityAbstract {   
    constructor() internal {}
    function execute(address, uint256, bytes calldata) external returns (uint256) {}
    function approve(uint256, bool) external returns (bool) {}
    function addKey(bytes32, Purpose, uint256) external returns (bool) {}
    function removeKey(bytes32, Purpose) external returns (bool) {}
    function addClaim(uint256,uint256,address,bytes calldata,bytes calldata,string calldata) external returns (bytes32) {}
    function removeClaim(bytes32) external returns (bool) {}
    function getKey(bytes32) external view returns(Purpose[] memory, uint256, bytes32) {}
    function getKeyPurpose(bytes32) external view returns(Purpose[] memory) {}
    function getKeysByPurpose(Purpose) external view returns(bytes32[] memory) {}
    function keyHasPurpose(bytes32, Purpose) external view returns(bool) {}
    function getClaim(bytes32) external view returns(uint256, uint256, address, bytes memory, bytes memory, string memory) {}
    function getClaimIdsByTopic(uint256) external view returns(bytes32[] memory) {}
}