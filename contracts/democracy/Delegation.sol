pragma solidity >=0.5.0 <0.6.0;

/**
 * @title Delegation
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH). 
 */
contract Delegation {
    event Delegate(address who, address to);
    //default delegation proxy, being used when user didn't set any delegation at this level.
    address public parentDelegation;

    //snapshots of changes, allow delegation changes be done at any time without compromising vote results.
    mapping (address => DelegateSet[]) public delegations;

    struct DelegateSet {
        uint128 fromBlock; //when this was updated
        address to; //who recieved this delegaton
    }
    
    /**
     * @notice Calls Constructor
     */
    constructor(address _parentDelegation) public {
        parentDelegation = _parentDelegation;
    }

    /** 
     * @notice Changes the delegation of `msg.sender` to `_to`. if _to 0x00: delegate to self. 
     *         In case of having a parent proxy, if never defined, fall back to parent proxy. 
     *         If once defined and want to delegate to parent proxy, set `_to` as parent address. 
     * @param _to To what address the caller address will delegate to.
     */
    function delegate(address _to) external {
        _updateDelegate(msg.sender, _to);
    }

    /**
     * @notice Reads `_who` configured delegation in this level, 
     *         or from parent level if `_who` never defined/defined to parent address.
     * @param _who What address to lookup.
     * @return The address `_who` choosen delegate to.
     */
    function delegatedTo(address _who)
        public
        view 
        returns (address) 
    {
        return delegatedToAt(_who, block.number);
    }

    /**
     * @notice Reads the final delegate of `_who` at block number `_block`.
     * @param _who Address to lookup.
     * @return Final delegate address.
     */
    function delegationOf(address _who)
        public
        view
        returns(address)
    {
        return delegationOfAt(_who, block.number);
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
        public
        view
        returns (address directDelegate)
    {
        DelegateSet[] storage checkpoints = delegations[_who];

        //In case there is no registry
        if (checkpoints.length == 0) {
            if (parentDelegation != 0x0) {
                return Delegation(parentDelegation).delegatedToAt(_who, _block);
            } else {
                return 0x0; 
            }
        }
        DelegateSet memory d = _getMemoryAt(checkpoints, _block);
        // Case user set delegate to parentDelegation address
        if (d.to == parentDelegation && d.to != 0x0) {
            return Delegation(parentDelegation).delegatedToAt(_who, _block); 
        }
        return d.to;
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
        public
        view
        returns(address finalDelegate)
    {
        finalDelegate = delegatedToAt(_who, _block);
        if (finalDelegate != 0x0) { //_who is delegating?
            return delegationOfAt(finalDelegate, _block); //load the delegation of _who delegation
        } else {
            return _who; //reached the endpoint of delegation
        }
             
    } 
    
    /** 
     * @dev Changes the delegation of `_from` to `_to`. if _to 0x00: delegate to self. 
     *         In case of having a parent proxy, if never defined, fall back to parent proxy. 
     *         If once defined and want to delegate to parent proxy, set `_to` as parent address. 
     * @param _from Address delegating.
     * @param _to Address delegated.
     */
    function _updateDelegate(address _from, address _to) internal {
        emit Delegate(_from, _to);
        DelegateSet memory _newFrom; //allocate memory
        DelegateSet[] storage fromHistory = delegations[_from];
    
        //Add the new delegation
        _newFrom.fromBlock = uint128(block.number);
        _newFrom.to = _to; //delegate address

        fromHistory.push(_newFrom); //register `from` delegation update;
    }

    /**
      * @dev `_getDelegationAt` retrieves the delegation at a given block number.
      * @param checkpoints The memory being queried.
      * @param _block The block number to retrieve the value at.
      * @return The delegation being queried.
      */
    function _getMemoryAt(DelegateSet[] storage checkpoints, uint _block) internal view returns (DelegateSet d) {
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

}