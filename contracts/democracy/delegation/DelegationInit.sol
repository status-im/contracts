pragma solidity >=0.5.0 <0.6.0;

import "./DelegationAbstract.sol";

/**
 * @title DelegationInit
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 */
contract DelegationInit is DelegationAbstract {

    /**
     * @notice Constructor of the model - only knows about watchdog that can trigger upgrade
     */
    constructor() public {
        parentDelegation = Delegation(address(-1)); //avoids calling create delegation within the Init contract.
    }

    /**
     * @notice Creates a new Delegation with `_parentDelegation` as default delegation.
     */
    function createDelegation(Delegation _parentDelegation) external {
        require(address(parentDelegation) == address(0), "Bad call"); //avoids control of Init contract
        parentDelegation = _parentDelegation;
    }

    /**
     * @notice Creates a new Delegation with `_parentDelegation` as default delegation.
     */
    function createDelegation(Delegation _parentDelegation, address defaultDelegate) external {
        require(address(parentDelegation) == address(0), "Bad call"); //avoids control of Init contract
        parentDelegation = _parentDelegation;
        updateDelegate(address(0), defaultDelegate);
    }
    
    function delegate(address) external {}
    function delegatedTo(address) external view returns (address) {}  
    function delegatedToAt(address,uint) external view returns (address) {}
    
}