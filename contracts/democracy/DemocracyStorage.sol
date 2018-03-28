pragma solidity ^0.4.17;

import "../deploy/InstanceStorage.sol";
import "../token/MiniMeTokenInterface.sol";
import "./TrustNetworkInterface.sol";
import "./ProposalManagerInterface.sol";

/**
 * @title DemocracyStorage
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @dev Defines kernel vars that Kernel contract share with Instance.
 *      Important to avoid overwriting wrong storage pointers is that 
 *      InstanceStorage should be always the first contract at heritance.
 */
contract DemocracyStorage is InstanceStorage {    
    // protected zone start (InstanceStorage vars)
    MiniMeTokenInterface public token;
    TrustNetworkInterface public trustNet;
    ProposalManagerInterface public proposalManager;
    // protected zone end
}