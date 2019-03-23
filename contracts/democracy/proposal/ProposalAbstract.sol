pragma solidity >=0.5.0 <0.6.0;

import "../../common/Controlled.sol";
import "../../deploy/InstanceAbstract.sol";
import "../../token/MiniMeToken.sol";
import "../delegation/Delegation.sol";
import "./Proposal.sol";

/**
 * @title ProposalAbstract
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * Store votes and tabulate results for Democracy. 
 */
contract ProposalAbstract is InstanceAbstract, Proposal, Controlled {   

    MiniMeToken public token;
    Delegation public delegation;
    uint256 public tabulationBlockDelay;
    
    bytes32 public dataHash;
    uint public blockStart;
    uint public voteBlockEnd;
    QuorumType quorum;
    //votes storage
    bytes32[] public signatures;
    mapping(address => Vote) public voteMap;

    //tabulation process 
    uint256 public lastTabulationBlock;
    mapping(address => address) public delegationOf;
    mapping(address => address) public tabulated;
    mapping(uint8 => uint256) public results;

    Vote public result;

    modifier votingPeriod {
        require(block.number >= blockStart, "Voting not started");
        require(block.number <= voteBlockEnd, "Voting ended");
        _;
    }

    modifier tabulationPeriod {
        require(block.number > voteBlockEnd, "Voting not ended");
        require(result == Vote.Null, "Tabulation ended");
        _;
    }

    modifier tabulationFinished {
        require(lastTabulationBlock != 0, "Tabulation not started");
        require(lastTabulationBlock + tabulationBlockDelay < block.number, "Tabulation not ended");
        _;
    }
}