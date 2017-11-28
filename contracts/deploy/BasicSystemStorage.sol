pragma solidity ^0.4.17;


/**
 * @title BasicSystemStorage
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @dev Defines system vars in a shared library among Stub and SystemLibraries to 
 * avoid overwriting wrong storage pointers
 */
contract BasicSystemStorage {    
    /// protected zone start (RecorverableSystem vars)
    address system;
    address recover;
    address watchdog;
    /// protected zone end
}