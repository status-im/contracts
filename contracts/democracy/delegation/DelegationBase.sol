pragma solidity >=0.5.0 <0.6.0;

import "./DelegationAbstract.sol";

/**
 * @title DelegationBase
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * @dev Creates a delegation proxy killable model for cheap redeploy and upgradability. 
 */
contract DelegationBase is DelegationAbstract {
    
    /**
     * @notice Calls Constructor
     */
    constructor(Delegation _parentDelegation) public {
        parentDelegation = _parentDelegation;
    }

    /** 
     * @notice Changes the delegation of `msg.sender` to `_to`. if _to 0x00: delegate to self. 
     *         In case of having a parent proxy, if never defined, fall back to parent proxy. 
     *         If once defined and want to delegate to parent proxy, set `_to` as parent address. 
     * @param _to To what address the caller address will delegate to.
     */
    function delegate(address _to) external {
        updateDelegate(msg.sender, _to);
    }

    /**
     * @notice Reads `_who` configured delegation in this level, 
     *         or from parent level if `_who` never defined/defined to parent address.
     * @param _who What address to lookup.
     * @return The address `_who` choosen delegate to.
     */
    function delegatedTo(address _who)
        external
        view 
        returns (address) 
    {
        return findDelegatedToAt(_who, block.number);
    }

    /**
     * @notice Reads the final delegate of `_who` at block number `_block`.
     * @param _who Address to lookup.
     * @return Final delegate address.
     */
    function delegationOf(address _who)
        external
        view
        returns(address)
    {
        return findDelegationOfAt(_who, block.number);
    }

    /**
     * @notice Reads `_who` configured delegation at block number `_block` in this level, 
     *         or from parent level if `_who` never defined/defined to parent address.
     * @param _who What address to lookup.
     * @param _block Block number of what height in history.
     * @return The address `_who` choosen delegate to.
     */
    function delegatedToAt(
        address _who,
        uint _block
    )
        external
        view
        returns (address directDelegate)
    {
        return findDelegatedToAt(_who, _block);
    }

    /**
     * @notice Reads the final delegate of `_who` at block number `_block`.
     * @param _who Address to lookup.
     * @param _block From what block.
     * @return Final delegate address.
     */
    function delegationOfAt(
        address _who,
        uint _block
    )
        external
        view
        returns(address finalDelegate)
    {
        return findDelegationOfAt(_who, _block); 
    } 

}