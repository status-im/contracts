pragma solidity ^0.4.21;

import "../token/MiniMeTokenInterface.sol";


contract DelegationProxyInterface {
    
    event Delegate(address who, address to);

    /** 
     * @notice Changes the delegation of `msg.sender` to `_to`. if _to 0x00: delegate to self. 
     *         In case of having a parent proxy, if never defined, fall back to parent proxy. 
     *         If once defined and want to delegate to parent proxy, set `_to` as parent address. 
     * @param _to To what address the caller address will delegate to.
     */
    function delegate(address _to) external;

    /**
     * @notice Reads `_who` configured delegation in this level, 
     *         or from parent level if `_who` never defined/defined to parent address.
     * @param _who What address to lookup.
     * @return The address `_who` choosen delegate to.
     */ 
    function delegatedTo(address _who)
        public
        view 
        returns (address directDelegate);
    
    /**
     * @notice Reads the final delegate of `_who` at block number `_block`.
     * @param _who Address to lookup.
     * @return Final delegate address.
     */
    function delegationOf(address _who)
        public
        view
        returns(address finalDelegate);

    /**
     * @notice Reads the sum of votes a `_who' have at block number `_block`.
     * @param _who From what address.
     * @param _token Address of source MiniMeTokenInterface.
     * @return Amount of influence of `who` have.
     */
    function influenceOf(
        address _who,
        MiniMeTokenInterface _token
    ) 
        public 
        view 
        returns(uint256 _total);

    /**
     * @notice Reads amount delegated influence `_who` received from other addresses.
     * @param _who What address to lookup.
     * @param _token Source MiniMeTokenInterface.
     * @return Sum of delegated influence received by `_who` in block `_block` from other addresses.
     */
    function delegatedInfluenceFrom(
        address _who,
        address _token
    )
        public 
        view 
        returns(uint256 _total);

    /**
     * @notice Reads amount delegated influence `_who` received from other addresses at block number `_block`.
     * @param _who What address to lookup.
     * @param _token Source MiniMeTokenInterface.
     * @param _block Position in history to lookup.
     * @return Sum of delegated influence received by `_who` in block `_block` from other addresses
     */
    function delegatedInfluenceFromAt(
        address _who,
        address _token,
        uint _block
    )
        public 
        view 
        returns(uint256 _total);

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
        returns (address directDelegate);
    
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
        returns(address finalDelegate);

    /**
     * @dev Reads amount delegated influence received from other addresses.
     * @param _who What address to lookup.
     * @param _token Source MiniMeTokenInterface.
     * @param _block Position in history to lookup.
     * @param _childProxy The child DelegationProxy requesting the call to parent.
     * @return Sum of delegated influence received by `_who` in block `_block` from other addresses.
     */
    function delegatedInfluenceFromAt(
        address _who,
        address _token,
        uint _block,
        address _childProxy
    )
        public
        view 
        returns(uint256 _total);

    /**
     * @notice Reads the sum of votes a `_who' have at block number `_block`.
     * @param _who From what address.
     * @param _token Address of source MiniMeTokenInterface.
     * @param _block From what block
     * @return Amount of influence of `who` have.
     */
    function influenceOfAt(
        address _who,
        MiniMeTokenInterface _token,
        uint _block
    )
        public
        view
        returns(uint256 _total);

    
}