pragma solidity ^0.4.17;

import "./DelayedUpdatableInstanceStorage.sol";
import "./DelegatedCall.sol";

/**
 * @title DelayedUpdatableInstance
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @dev Contract that can be updated by a call from itself.
 */
contract DelayedUpdatableInstance is DelayedUpdatableInstanceStorage, DelegatedCall {

    event UpdateRequested(address newKernel, uint256 activation);
    event UpdateCancelled();
    event UpdateConfirmed(address oldKernel, address newKernel);

    function DelayedUpdatableInstance(address _kernel) public {
        kernel = _kernel;
    }

    /**
     * @dev delegatecall everything (but declared functions) to `_target()`
     * @notice Verify `kernel()` code to predict behavior
     */
    function () external delegated {
        //all goes to kernel
    }

    /**
     * @dev returns configured kernel
     * @return kernel address
     */
    function targetDelegatedCall()
        internal
        constant
        returns(address)
    {
        return kernel;
    }
    
    function updateRequestUpdatableInstance(address _kernel) external {
        require(msg.sender == address(this));
        uint activation = block.timestamp + 30 days;
        update = Update(_kernel, activation);
        UpdateRequested(_kernel, activation);
    }

    function updateConfirmUpdatableInstance(address _kernel) external {
        require(msg.sender == address(this));
        Update memory pending = update;
        require(pending.kernel == _kernel);
        require(pending.activation < block.timestamp);
        kernel = pending.kernel;
        delete update;
        UpdateConfirmed(kernel, pending.kernel);
    }

    function updateCancelUpdatableInstance() external {
        require(msg.sender == address(this));
        delete update;
    }

}