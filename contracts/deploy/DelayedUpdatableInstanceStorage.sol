pragma solidity ^0.4.17;

import "./InstanceStorage.sol";

/**
 * @title InstanceStorage
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @dev Defines kernel vars that Kernel contract share with Instance.
 *      Important to avoid overwriting wrong storage pointers is that 
 *      InstanceStorage should be always the first contract at heritance.
 */
contract DelayedUpdatableInstanceStorage is InstanceStorage {    
    // protected zone start (InstanceStorage vars)
    Update update;
    
    struct Update {
        address kernel;
        uint256 activation;
    }
    // protected zone end
}