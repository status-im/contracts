pragma solidity ^0.4.17;

import "../deploy/BasicSystemStorage.sol";
import "../token/MiniMeTokenInterface.sol";
import "../democracy/TrustNetworkInterface.sol";

/**
 * @title InstanceStorage
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @dev Defines kernel vars that Kernel contract share with Instance.
 *      Important to avoid overwriting wrong storage pointers is that 
 *      InstanceStorage should be always the first contract at heritance.
 */
contract ConstitutionStorage is BasicSystemStorage {    
    // protected zone start (InstanceStorage vars)
    MiniMeTokenInterface public token;
    TrustNetworkInterface public trustNet;
    address proposalManager;
    // protected zone end
}