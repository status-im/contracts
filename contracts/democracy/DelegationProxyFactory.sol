pragma solidity ^0.4.11;

import "./DelegationProxyModel.sol";
import "../deploy/RecoverableSystem.sol";
import "../deploy/KillableModel.sol";

/**
 * @title DelegationProxyFactory
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * @dev Upgradable delegation proxy factory
 */
contract DelegationProxyFactory {

    address public systemModel;
    address public recover;
    address public watchdog;

    function DelegationProxyFactory(address _recover, address _watchdog) public {
        watchdog = _watchdog;
        recover = _recover;
        systemModel = new DelegationProxyModel(watchdog);
    }

    function create(address _parent) external returns (DelegationProxy) { 
         DelegationProxyModel instance = DelegationProxyModel(address(new RecoverableSystem(systemModel, recover)));
         instance.initialize(_parent);
         return DelegationProxy(address(instance));
    }

}