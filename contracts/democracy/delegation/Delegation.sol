pragma solidity >=0.5.0 <0.6.0;

interface Delegation {
    
    event Delegate(address who, address to);

    /** 
     * @notice Set `msg.sender` delegate.
     * `_to == address(0)` resets to parent delegation
     * `_to == msg.sender` ends delegate chain.
     * @param _to Address the caller will delegate to.
     */
    function delegate(address _to) external;

    /**
     * @notice Reads `_who` configured delegation in this level or
     * from parent level if `_who` never defined/reset.
     * @param _who What address to lookup.
     * @return The address `_who` choosen delegate to.
     */ 
    function delegatedTo(address _who)
        external
        view 
        returns (address directDelegate);
    
    /**
     * @notice Reads `_who` configured delegation at block number `_block` or 
     * from parent level if `_who` never defined/reset.
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
        returns (address directDelegate);
    
    /**
     * @notice Reads the final delegate of `_who` at block number `_block`.
     * @param _who Address to lookup.
     * @return Final delegate address.
     */
    function delegationOf(address _who)
        external
        view
        returns(address finalDelegate);
    
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
        returns(address finalDelegate);
    
}