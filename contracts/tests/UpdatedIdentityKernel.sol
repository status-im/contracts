pragma solidity ^0.4.17;

import "../identity/IdentityKernel.sol";


contract UpdatedIdentityKernel is IdentityKernel {

    event TestFunctionExecuted(uint256 minApprovalsByManagementKeys);

    function test() public {
        TestFunctionExecuted(purposeThreshold[MANAGEMENT_KEY]);
    }   
}