pragma solidity >=0.5.0 <0.6.0;

import "../../common/Controlled.sol";
import "../../deploy/InstanceAbstract.sol";
import "../../token/MiniMeToken.sol";
import "../delegation/Delegation.sol";
import "./Proposal.sol";

/**
 * @title Proposal
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * Store votes and tabulate results for Democracy  
 */
contract ProposalAbstract is InstanceAbstract, Proposal, Controlled {   

    MiniMeToken public token;
    Delegation public delegation;
    uint256 public tabulationBlockDelay;
    
    bytes32 topic; 
    bytes32 txHash;
    uint blockStart;
    uint voteBlockEnd;

    //votes storage
    bytes32[] signatures;
    mapping(address => Vote) voteMap;

    //tabulation process 
    uint256 lastTabulationBlock;
    mapping(address => address) delegationOf;
    mapping(address => address) tabulated;
    mapping(uint8 => uint256) results;

    Vote result;
 


}