pragma solidity >=0.5.0 <0.6.0;

import "../../deploy/InstanceFactory.sol";
import "../../deploy/Instance.sol";
import "./DelegationAbstract.sol";

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
        Delegation _parent
    ) 
        external 
        returns (DelegationAbstract instance)
    {
        instance = DelegationAbstract(new Instance(base, prototypes[address(base)].init, msg.data));
        emit InstanceCreated(instance);
    }

}