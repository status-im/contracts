pragma solidity ^0.4.17;

import "../identity/IdentityKernel.sol";


contract UpdatedIdentityKernel is IdentityKernel {

    event TestFunctionExecuted(uint8 minApprovalsByManagementKeys);

    function test() public {
        TestFunctionExecuted(minimumApprovalsByKeyType[MANAGEMENT_KEY]);
    }   
}