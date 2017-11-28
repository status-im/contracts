pragma solidity ^0.4.11;

import "../deploy/KillableModel.sol";
import "./DelegationProxy.sol";

/**
 * @title DelegationProxyModel
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * @dev Creates a delegation proxy killable model for cheap redeploy and upgradability. 
 */
contract DelegationProxyModel is KillableModel, DelegationProxy {
    bool private ready = false;

    /**
     * @notice Constructor of the model - only knows about watchdog that can trigger upgrade
     */
    function DelegationProxyModel(address _watchdog) KillableModel(_watchdog) DelegationProxy(0x0) public {
        ready = true;
    }

    /**
     * @notice Creates a new DelegationProxy with `_parentProxy` as default delegation.
     */
    function initialize(address _parentProxy) public {
        require(!ready);
        ready = true;
        parentProxy = _parentProxy;
    }

}