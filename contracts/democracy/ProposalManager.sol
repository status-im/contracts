pragma solidity ^0.4.21;

import "../common/Controlled.sol";
import "../token/MiniMeTokenInterface.sol";
import "./DelegationProxyInterface.sol";
import "./TrustNetworkInterface.sol";

/**
 * @title ProposalManager
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * Store the proposals, votes and tabulate results for Democracy  
 */
contract ProposalManager is Controlled {
    event ProposalSet(bytes32 indexed topic, uint256 proposalId, bytes32 txHash);
    event ProposalResult(uint256 proposalId, uint8 finalResult);

    MiniMeTokenInterface public token;
    TrustNetworkInterface public trustNet;
    uint256 public tabulationBlockDelay;
    Proposal[] public proposals;
    
    struct Proposal {
        bytes32 topic; 
        bytes32 txHash;

        uint blockStart;
        uint voteBlockEnd;

        address[] voters;
        mapping(address => Vote) voteMap;

        mapping(address => bool) tabulated;
        mapping(uint8 => uint256) results;
        Vote result;
        uint256 lastTabulationTimestamp;
    }
    
    enum Vote { 
        Null,
        Reject, 
        Approve
    }

    constructor(
        MiniMeTokenInterface _token,
        TrustNetworkInterface _trustNet
    ) 
        public
    {
        trustNet = _trustNet;
        token = _token;
        
    }

    function addProposal(
        bytes32 _topic,
        bytes32 _txHash
    )
        public
        returns (uint proposalId)
    {
        proposalId = proposals.length++;
        Proposal storage p = proposals[proposalId];
        
        p.topic = _topic;
        p.txHash = _txHash;

        p.blockStart = block.number + 0; //will be replaced by configurations
        p.voteBlockEnd = p.blockStart + 10; //dummy value
        emit ProposalSet(_topic, proposalId, _txHash);
    }

    function voteProposal(uint _proposalId, Vote _vote) 
        public
    {
        Proposal storage proposal = proposals[_proposalId];
        require(block.number >= proposal.blockStart);
        require(block.number <= proposal.voteBlockEnd);
        proposal.voteMap[msg.sender] = _vote;

    }

    function tabulateVote(uint _proposalId, address _delegator) 
        public
    {
        Proposal storage proposal = proposals[_proposalId];
        require(block.number > proposal.voteBlockEnd);
        require(!proposal.tabulated[_delegator]);
        proposal.tabulated[_delegator] = true;
        Vote _vote = proposal.voteMap[_delegator];
        if(_vote == Vote.Null) {
            address delegate = trustNet.getVoteDelegation(proposal.topic).delegationOfAt(_delegator, proposal.voteBlockEnd);
            _vote = proposal.voteMap[delegate];
        }

        if (_vote == Vote.Reject || _vote == Vote.Approve) {
            proposal.results[uint8(_vote)] += token.balanceOfAt(_delegator, proposal.voteBlockEnd);
        }
        proposal.lastTabulationTimestamp = block.timestamp;
    }

    function finalResult(uint _proposalId)
        public
    {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.lastTabulationTimestamp + tabulationBlockDelay > block.number);
        require(proposal.result == Vote.Null);
        uint256 totalTokens = token.totalSupplyAt(proposal.voteBlockEnd);
        uint256 approvals = proposal.results[uint8(Vote.Approve)];
        uint256 approvalQuorum = (totalTokens / 2);
        if(approvals >= approvalQuorum) {
            proposal.result = Vote.Approve;
        } else {
            proposal.result = Vote.Reject;
        }
        emit ProposalResult(_proposalId, uint8(proposal.result));
    }




    function getProposalFinalResult(
        uint256 _proposalId
    )
        external 
        view 
        returns (uint8)
    {

        return uint8(proposals[_proposalId].result);
    } 

    function getProposalCount() 
        external
        view 
        returns (uint256){
        return proposals.length;
    }

    function getProposal(uint _proposalId)
        external
        view
        returns (
            bytes32 topic,
            bytes32 txHash,
            bool approved,
            Vote vote
        )
    {
        Proposal storage p = proposals[_proposalId];
        return (p.topic, p.txHash, p.result == Vote.Approve, p.voteMap[msg.sender]);
    } 

    function getProposalData(uint _proposalId)
        external
        view
        returns (
            bytes32 topic,
            bytes32 txHash,
            uint blockStart,
            uint voteBlockEnd,
            Vote result
        )
    {
        Proposal storage p = proposals[_proposalId];
        return (p.topic, p.txHash, p.blockStart, p.voteBlockEnd, p.result);
    }

    
    function offchainTabulateVoteResult(uint256 _proposalId) 
        external
        view
        returns (uint256[] votes) 
    {
        Proposal memory proposal = proposals[_proposalId];
        address[] memory voters = proposal.voters;
        uint256 len = proposal.voters.length;
        votes = new uint256[](4);
        for(uint256 i = 0; i < len; i++) {
            address voter = proposal.voters[i];
            uint8 voteIndex = uint8(proposals[_proposalId].voteMap[voter]);
            votes[voteIndex] += trustNet.getVoteDelegation(proposal.topic).influenceOfAt(proposal.voters[i], token, proposal.voteBlockEnd);
        }
        
    }
}