pragma solidity >=0.5.0 <0.6.0;

import "./SNTController.sol";

/**
 * @dev Status Network is implemented here
 */
contract StatusNetwork is SNTController {

    /**
     * @notice Constructor
     * @param _owner Authority address
     * @param _snt SNT token
     */
    constructor(
        address payable _owner,
        MiniMeToken _snt
    ) 
        public 
        SNTController(_owner, _snt)    
    { }

}