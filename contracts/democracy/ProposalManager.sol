pragma solidity ^0.4.17;

import "./TrustNetwork.sol";
import "./DelegationProxy.sol";
import "./ProposalExecutor.sol";
import "../token/MiniMeToken.sol";
import "../common/Controlled.sol";


/**
 * @title ProposalManager
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * Store the proposals, votes and results for other smartcontracts  
 */
contract ProposalManager is Controlled {
 
    TrustNetwork public trustNet;
    MiniMeToken public SNT;
    address public stakeBank;

    Proposal[]  proposals;
    
    struct Proposal {
        address topic; 

        uint value;
        bytes data;
        uint stake;

        uint blockStart;
        uint voteBlockEnd;
        uint vetoBlockEnd;

        VoteTicket[] votes;
        mapping(address => uint) voteIndex;

        uint tabulationPosition;
        bool tabulated;
        mapping(uint8 => uint) results;
        
        bool approved;
        bool executed;
    }


    struct VoteTicket {
        address voter;
        Vote vote;
    }
    
    enum Vote { 
        Reject, 
        Approve,
        Veto  
    }
     
    function ProposalManager(MiniMeToken _SNT, TrustNetwork _trustNet, address _stakeBank) public {
        trustNet = _trustNet;
        SNT = _SNT;
        stakeBank = _stakeBank;
    }

    function addProposal(address topic, uint value, bytes data, uint stake) public returns (uint) {
        require(stake > 1000);
        require(SNT.transferFrom(msg.sender, stakeBank, stake));
        uint pos = proposals.length++;
        Proposal storage p = proposals[pos];
        
        p.topic = topic;
        p.value = value;
        p.data = data;
        p.stake = stake;

        p.blockStart = block.number + 1000; //will be replaced by configurations
        p.voteBlockEnd = p.blockStart + 10000; //dummy value
        p.vetoBlockEnd = p.voteBlockEnd + 5000; //dummy value
        
        return pos;
    }

    function getProposal(uint id) public constant returns (address topic, uint value, uint stake, bool approved, bool executed) {
        Proposal memory p = proposals[id];
        return (p.topic, p.value, p.stake, p.approved, p.executed);
    } 

    function getProposalData(uint id) public constant returns(bytes) {
        return proposals[id].data;
    }

    function execute(uint id) public {
        Proposal memory p = proposals[id];
        proposals[id].executed = true;
        ProposalExecutor(controller).executeProposal(p.topic, p.value, p.data);
    }

    function vote(uint _proposal, Vote _vote) public {
        Proposal storage proposal = proposals[_proposal];
        require(block.number >= proposal.blockStart);
        if (_vote == Vote.Veto) {
            require(block.number <= proposal.vetoBlockEnd);
        } else {
            require(block.number <= proposal.voteBlockEnd);
        }
        uint votePos = proposal.voteIndex[msg.sender];
        if (votePos == 0) {
            votePos = proposal.votes.length;
        } else {
            votePos = votePos - 1;
        }
        VoteTicket storage ticket = proposal.votes[votePos];
        assert (ticket.voter == 0x0 || ticket.voter == msg.sender);
        ticket.voter = msg.sender;
        ticket.vote = _vote;
        proposal.voteIndex[msg.sender] = votePos + 1;
    }

   function tabulate(uint _proposal, uint loopLimit) public {
        Proposal storage proposal = proposals[_proposal];
        require(block.number > proposal.vetoBlockEnd);
        require(!proposal.tabulated);
        
        uint totalVoted = proposal.votes.length;
        if (loopLimit == 0) {
            loopLimit = totalVoted;    
        }
        require (loopLimit <= totalVoted);
        require (loopLimit > proposal.tabulationPosition);
        
        DelegationProxy voteDelegation;
        DelegationProxy vetoDelegation;
        (voteDelegation, vetoDelegation) = trustNet.getTopic(proposal.topic);
        
        for (uint i = proposal.tabulationPosition; i < loopLimit; i++) {
            VoteTicket memory _vote = proposal.votes[i];
            if (_vote.vote == Vote.Reject || _vote.vote == Vote.Approve) {
                proposal.results[uint8(_vote.vote)] += voteDelegation.influenceOfAt(_vote.voter, SNT, proposal.voteBlockEnd);
            } else {
                proposal.results[uint8(_vote.vote)] += vetoDelegation.influenceOfAt(_vote.voter, SNT, proposal.vetoBlockEnd);
            }
        }
        
        proposal.tabulationPosition = i;
        if (proposal.tabulationPosition == totalVoted) {
            proposal.tabulated = true;        
        }
   }

}