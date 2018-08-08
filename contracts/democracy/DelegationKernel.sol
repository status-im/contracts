pragma solidity ^0.4.21;

import "../deploy/InstanceStorage.sol";
import "./DelegationView.sol";

/**
 * @title DelegationKernel
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * @dev Creates a delegation proxy killable model for cheap redeploy and upgradability. 
 */
contract DelegationKernel is InstanceStorage, DelegationView {
    bool private ready = false; //TODO: abstract initialized flag

    /**
     * @notice Constructor of the model - only knows about watchdog that can trigger upgrade
     */
    constructor() DelegationView(0x0) public {
        ready = true; 
    }

    /**
     * @notice Creates a new Delegation with `_parentDelegation` as default delegation.
     */
    function initializeDelegation(address _parentDelegation) public {
        require(!ready);
        ready = true;
        parentDelegation = _parentDelegation;
    }

}