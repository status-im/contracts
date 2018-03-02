pragma solidity ^0.4.17;

import "../deploy/InstanceStorage.sol";
import "./Identity.sol";

contract IdentityKernel is InstanceStorage, Identity {

    function initIdentity(address _caller) external {
        require(minimumApprovalsByKeyPurpose[MANAGEMENT_KEY] == 0);
        _addKey(bytes32(_caller), MANAGEMENT_KEY, 0);
        minimumApprovalsByKeyPurpose[MANAGEMENT_KEY] = 1;
    }
}
