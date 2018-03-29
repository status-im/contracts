pragma solidity ^0.4.21;

/** @notice Interface for fee collector */
contract FeeCollector {
    
    /** 
     * @notice Collect a fee from yourself in your address
     * @param _amount to be collected
     */
    function collect(uint256 _amount) external;
    
    /** 
     * @notice Collect a fee from your address in name of someone
     * @param _from to which address fee will be registered to
     * @param _amount to be collected
     */
    function collectFor(address _from, uint256 _amount) external;
    
    /** 
     * @notice Collect a fee from someone
     * @param _from who allowed collection
     * @param _amount to be collected
     */
    function collectFrom(address _from, uint256 _amount) external;

}