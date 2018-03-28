pragma solidity ^0.4.21;

import "./ProposalManagerInterface.sol";
import "./TrustNetworkInterface.sol";
import "./DelegationProxyInterface.sol";
import "../token/MiniMeTokenInterface.sol";
import "../common/Controlled.sol";

/**
 * @title ProposalManager
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * Store the proposals, votes and results for other smartcontracts  
 */
contract ProposalManager is ProposalManagerInterface, Controlled {
   
    function ProposalManager(MiniMeTokenInterface _SNT, TrustNetworkInterface _trustNet) public {
        trustNet = _trustNet;
        token = _SNT;
    }

    function addProposal(bytes32 _topic, bytes32 _txHash, uint _stake) public returns (uint) {
        require(_stake > 1000);
        require(token.transferFrom(msg.sender, address(this), _stake));
        uint pos = proposals.length++;
        Proposal storage p = proposals[pos];
        
        p.topic = _topic;
        p.txHash = _txHash;
        p.stake = _stake;
        p.staker = msg.sender;

        p.blockStart = block.number + 1000; //will be replaced by configurations
        p.voteBlockEnd = p.blockStart + 10000; //dummy value
        p.vetoBlockEnd = p.voteBlockEnd + 5000; //dummy value
        
        return pos;
    }

    function getProposal(uint id) public constant returns (bytes32 topic, bytes32 txHash, uint stake, address staker, bool approved, bool executed) {
        Proposal memory p = proposals[id];
        return (p.topic, p.txHash, p.stake, p.staker, p.approved, p.executed);
    } 

    function getProposalTxHash(uint id) public constant returns(bytes32) {
        return proposals[id].txHash;
    }

    function vote(uint _proposal, Vote _vote) public {
        Proposal storage proposal = proposals[_proposal];
        require(block.number >= proposal.blockStart);
        if (_vote == Vote.Veto) {
            require(block.number <= proposal.vetoBlockEnd);
        } else {
            require(block.number <= proposal.voteBlockEnd);
        }

        proposal.voteMap[msg.sender] = _vote;

    }

    function tabulateVote(uint _proposal, address _delegator) public {
        Proposal storage proposal = proposals[_proposal];
        require(block.number > proposal.voteBlockEnd);
        require(!proposal.tabulated[_delegator].vote);
        proposal.tabulated[_delegator].vote = true;
        Vote _vote = proposal.voteMap[_delegator];
        if(_vote == Vote.Null) {
            address delegate = trustNet.getVoteDelegation(proposal.topic).delegationOfAt(_delegator, proposal.vetoBlockEnd);
            _vote = proposal.voteMap[delegate];
        }

        if (_vote == Vote.Reject || _vote == Vote.Approve) {
            proposal.results[uint8(_vote)] += token.balanceOfAt(_delegator, proposal.voteBlockEnd);
        }
    }

    function tabulateVeto(uint _proposal, address _delegator) public {
        Proposal storage proposal = proposals[_proposal];
        require(block.number > proposal.vetoBlockEnd);
        require(!proposal.tabulated[_delegator].veto);
        proposal.tabulated[_delegator].veto = true;
        Vote _vote = proposal.voteMap[_delegator];
        if (_vote == Vote.Null) {
            address delegate = trustNet.getVetoDelegation(proposal.topic).delegationOfAt(_delegator, proposal.vetoBlockEnd);
            _vote = proposal.voteMap[delegate];
        }

        if (_vote == Vote.Veto) {
            proposal.results[uint8(Vote.Veto)] += token.balanceOfAt(_delegator, proposal.vetoBlockEnd);
        }
        
    }

    function approve(uint _proposal) public {
        Proposal storage proposal = proposals[_proposal];
        require(proposal.vetoBlockEnd + tabulationBlockDelay > block.number);
        require(!proposal.approved);
        uint256 totalTokens = token.totalSupplyAt(proposal.vetoBlockEnd);
        uint256 approvals = proposal.results[uint8(Vote.Approve)];
        uint256 veto = proposal.results[uint8(Vote.Veto)];
        uint256 approvalQuorum = (totalTokens / 2);
        uint256 vetoQuorum = (totalTokens / 3);
        require(veto < vetoQuorum); 
        require(approvals >= approvalQuorum);
        proposal.approved = true;
        require(token.transferFrom(address(this), proposal.staker, proposal.stake));
    }

    function setExecuted(uint id) public onlyController {
        Proposal memory p = proposals[id];
        require(p.approved);
        require(!p.executed);
        proposals[id].executed = true;
    }
}