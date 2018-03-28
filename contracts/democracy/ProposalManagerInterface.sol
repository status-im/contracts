pragma solidity ^0.4.21;

import "./TrustNetworkInterface.sol";
import "./DelegationProxyInterface.sol";
import "../token/MiniMeTokenInterface.sol";

/**
 * @title ProposalManager
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * Store the proposals, votes and results for other smartcontracts  
 */
contract ProposalManagerInterface {
 
    TrustNetworkInterface public trustNet;
    MiniMeTokenInterface public token;
    uint256 public tabulationBlockDelay;

    Proposal[] public proposals;
    
    struct Proposal {
        bytes32 topic; 
        bytes32 txHash;

        uint stake;
        address staker;

        uint blockStart;
        uint voteBlockEnd;
        uint vetoBlockEnd;

        mapping(address => Vote) voteMap;
        mapping(address => Tabulations) tabulated;
        mapping(uint8 => uint256) results;
        
        bool approved;
        bool executed;
    }
    
    struct Tabulations {
        bool vote;
        bool veto;
    }

    enum Vote { 
        Null,
        Reject, 
        Approve,
        Veto  
    }

    function addProposal(bytes32 _topic, bytes32 _txHash, uint _stake) public returns (uint);
    function getProposal(uint _id) public constant returns (bytes32 topic, bytes32 txHash, bool approved, bool executed);
    function getProposalTxHash(uint _id) public constant returns(bytes32);
    function vote(uint _proposal, Vote _vote) public;
    function tabulateVote(uint _proposal, address _delegator) public;
    function tabulateVeto(uint _proposal, address _delegator) public;
    function approve(uint _proposal) public;
    function setExecuted(uint _id, bytes32 _txHash) public returns(bool);
}