pragma solidity >=0.5.0 <0.6.0;

import "./DelegationInterface.sol";
import "./DelegationKernel.sol";
import "../deploy/Factory.sol";
import "../deploy/Instance.sol";

/**
 * @title DelegationFactory
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * @dev Upgradable delegation proxy factory
 */
contract DelegationFactory is Factory {

    constructor() 
        Factory(new DelegationKernel()) 
        public 
    { }

    function createDelegation(address _parent) 
        external 
        returns (DelegationInterface)
    { 
        DelegationKernel instance = DelegationKernel(address(new Instance(latestKernel)));
        instance.initializeDelegation(_parent);
        return DelegationInterface(address(instance));
    }

}