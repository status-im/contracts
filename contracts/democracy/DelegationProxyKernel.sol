pragma solidity ^0.4.21;

import "../deploy/InstanceStorage.sol";
import "./DelegationProxyView.sol";

/**
 * @title DelegationProxyKernel
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * @dev Creates a delegation proxy killable model for cheap redeploy and upgradability. 
 */
contract DelegationProxyKernel is InstanceStorage, DelegationProxyView {
    bool private ready = false; //TODO: abstract initialized flag

    /**
     * @notice Constructor of the model - only knows about watchdog that can trigger upgrade
     */
    function DelegationProxyKernel() DelegationProxy(0x0) public {
        ready = true; 
    }

    /**
     * @notice Creates a new DelegationProxy with `_parentProxy` as default delegation.
     */
    function initializeDelegationProxy(address _parentProxy) public {
        require(!ready);
        ready = true;
        parentProxy = _parentProxy;
    }

}