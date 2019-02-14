pragma solidity >=0.5.0 <0.6.0;

import "../deploy/InstanceFactory.sol";
import "../deploy/Instance.sol";

/**
 * @title DelegationFactory
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * @dev Upgradable delegation proxy factory
 */
contract DelegationFactory is InstanceFactory {

    constructor(InstanceAbstract _base, InstanceAbstract _init, InstanceAbstract _emergency) 
        InstanceFactory(_base, _init, _emergency)
        public
    { }

    function createDelegation(
        address
    ) 
        external 
        returns (InstanceAbstract instance)
    {
        instance = new Instance(base, prototypes[address(base)].init, msg.data);
        emit InstanceCreated(instance);
    }

}