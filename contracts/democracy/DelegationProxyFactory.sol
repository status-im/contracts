pragma solidity ^0.4.21;

import "./DelegationProxyInterface.sol";
import "./DelegationProxyKernel.sol";
import "../deploy/Factory.sol";
import "../deploy/Instance.sol";

/**
 * @title DelegationProxyFactory
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * @dev Upgradable delegation proxy factory
 */
contract DelegationProxyFactory is Factory {

    constructor() 
        Factory(new DelegationProxyKernel()) 
        public 
    { }

    function createDelegationProxy(address _parent) 
        external 
        returns (DelegationProxyInterface)
    { 
        DelegationProxyKernel instance = DelegationProxyKernel(address(new Instance(latestKernel)));
        instance.initializeDelegationProxy(_parent);
        return DelegationProxyInterface(address(instance));
    }

}