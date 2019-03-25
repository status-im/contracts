pragma solidity >=0.5.0 <0.6.0;

import "../../deploy/InstanceAbstract.sol";
import "./Delegation.sol";

/**
 * @title DelegationAbstract
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH). 
 */
contract DelegationAbstract is InstanceAbstract, Delegation {
    struct DelegateSet {
        uint96 fromBlock; //when this was updated
        address to; //who recieved this delegaton
    }
    //default delegation proxy, being used when user didn't set any delegation at this level.
    Delegation public parentDelegation;

    //snapshots of changes, allow delegation changes be done at any time without compromising vote results.
    mapping (address => DelegateSet[]) public delegations;


    constructor() internal {

    }

    /** 
     * @dev Changes the delegation of `_from` to `_to`. 
     * If `_to` is set to 0x00, fall to parent proxy.
     * If `_to == _from` removes delegation.
     * @param _from Address delegating.
     * @param _to Address delegated.
     */
    function updateDelegate(address _from, address _to) internal {
        emit Delegate(_from, _to);
        DelegateSet memory _newFrom; //allocate memory
        DelegateSet[] storage fromHistory = delegations[_from];
    
        //Add the new delegation
        _newFrom.fromBlock = uint96(block.number);
        _newFrom.to = _to; //delegate address

        fromHistory.push(_newFrom); //register `from` delegation update;
    }

    /**
      * @dev `_getDelegationAt` retrieves the delegation at a given block number.
      * @param checkpoints The memory being queried.
      * @param _block The block number to retrieve the value at.
      * @return The delegation being queried.
      */
    function getMemoryAt(DelegateSet[] storage checkpoints, uint _block) internal view returns (DelegateSet memory d) {
        // Case last checkpoint is the one;
        if (_block >= checkpoints[checkpoints.length-1].fromBlock) {
            d = checkpoints[checkpoints.length-1];
        } else {    
            // Lookup in array;
            uint min = 0;
            uint max = checkpoints.length-1;
            while (max > min) {
                uint mid = (max + min + 1) / 2;
                if (checkpoints[mid].fromBlock <= _block) {
                    min = mid;
                } else {
                    max = mid-1;
                }
            }
            d = checkpoints[min];
        }
    }

     /**
     * @notice Reads `_who` configured delegation at block number `_block` in this level, 
     *         or from parent level if `_who` never defined/defined to parent address.
     * @param _who What address to lookup.
     * @param _block Block number of what height in history.
     * @return The address `_who` choosen delegate to.
     */
    function findDelegatedToAt(
        address _who,
        uint _block
    )
        internal
        view
        returns (address directDelegate)
    {
        DelegateSet[] storage checkpoints = delegations[_who];

        //In case there is no registry
        if (checkpoints.length == 0) {
            return (
                address(parentDelegation) == address(0) ?
                address(0) : parentDelegation.delegatedToAt(_who, _block)
            );
        }
        return getMemoryAt(checkpoints, _block).to;
    }

}