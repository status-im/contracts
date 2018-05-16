pragma solidity ^0.4.23;

import "../identity/IdentityKernel.sol";


contract UpdatedIdentityKernel is IdentityKernel {

    event TestFunctionExecuted(uint256 minApprovalsByManagementKeys);

    function test() public {
        emit TestFunctionExecuted(purposeThreshold[MANAGEMENT_KEY]);
    }   
}