pragma solidity >=0.5.0 <0.6.0;

import "./IdentityEmpty.sol";

/**
 * @title IdentityExtension
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @dev Abstract extension
 */
contract IdentityExtension is IdentityEmpty {  
    constructor() internal {} 
    function installExtension(IdentityAbstract _extension, bool _enable) external;
}