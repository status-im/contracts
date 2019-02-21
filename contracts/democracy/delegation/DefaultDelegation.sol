pragma solidity >=0.5.0 <0.6.0;

import "./Delegation.sol";
import "../../common/Controlled.sol";

contract DefaultDelegation is Delegation, Controlled {
    address public defaultDelegate;
    
    constructor(address _defaultDelegate) public {
        defaultDelegate = _defaultDelegate;
    }

    /** 
     * @notice Changes default delegation
     * @param _to What is the default delegate.
     */
    function delegate(address _to) external onlyController {
        defaultDelegate = _to;
    }

    function delegatedTo(address)
        external
        view 
        returns (address directDelegate) 
    {
        return defaultDelegate;
    }
    
    function delegationOf(address)
        external
        view
        returns(address finalDelegate) 
    {
        return defaultDelegate;
    }

    function delegatedToAt(
        address,
        uint
    )
        external
        view
        returns (address directDelegate) 
    {
        return defaultDelegate;
    }
    
    function delegationOfAt(
        address,
        uint
    )
        external
        view
        returns(address finalDelegate) 
    {
        return defaultDelegate;
    }
    
}