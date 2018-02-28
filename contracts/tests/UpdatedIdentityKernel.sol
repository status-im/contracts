pragma solidity ^0.4.17;

import "../identity/IdentityKernel.sol";

contract UpdatedIdentityKernel is IdentityKernel {

    function initIdentity(address _caller) external {
        require(minimumApprovalsByKeyType[MANAGEMENT_KEY] == 0);
        _addKey(bytes32(_caller), MANAGEMENT_KEY, 0);
        minimumApprovalsByKeyType[MANAGEMENT_KEY] = 1;
    }

    event TestFunctionExecuted(uint8 minApprovalsByManagementKeys);

    function test() public {
        TestFunctionExecuted(minimumApprovalsByKeyType[MANAGEMENT_KEY]);
    }

    
}
