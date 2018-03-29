pragma solidity ^0.4.21;

import "../common/Controlled.sol";
import "../token/MiniMeTokenInterface.sol";
import "./ProposalManagerInterface.sol";
import "./TrustNetworkInterface.sol";
import "./DelegationProxyInterface.sol";

/**
 * @title ProposalManager
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * Store the proposals, votes and tabulate results for Democracy  
 */
contract ProposalManager is ProposalManagerInterface, Controlled {

    function ProposalManager(
        MiniMeTokenInterface _SNT,
        TrustNetworkInterface _trustNet,
        FeeCollector _feeCollector
    ) 
        public
    {
        trustNet = _trustNet;
        token = _SNT;
        feeCollector = _feeCollector;
    }

    function addProposal(
        bytes32 _topic,
        bytes32 _txHash,
        uint _visibilityFee
    )
        public
        returns (uint proposalId)
    {
        require(_visibilityFee > minVisibilityFee);
        require(
            token.transferFrom(
                msg.sender,
                address(this),
                _visibilityFee
            )
        );
        token.approve(feeCollector, _visibilityFee);
        feeCollector.collectFor(msg.sender, _visibilityFee);
        proposalId = proposals.length++;
        Proposal storage p = proposals[proposalId];
        
        p.topic = _topic;
        p.txHash = _txHash;
        p.visibilityFee = _visibilityFee;

        p.blockStart = block.number + 1000; //will be replaced by configurations
        p.voteBlockEnd = p.blockStart + 10000; //dummy value
        p.vetoBlockEnd = p.voteBlockEnd + 5000; //dummy value
        emit ProposalSet(_topic, proposalId, _txHash, _visibilityFee);
    }

    function increaseProposalVisibility(
        uint _proposalId,
        uint256 _visibilityFee
    )
        external
    {
        require(_visibilityFee > minVisibilityFee);
        require(
            token.transferFrom(
                msg.sender,
                address(this),
                _visibilityFee
            )
        );
        token.approve(feeCollector, _visibilityFee);
        feeCollector.collectFor(msg.sender, _visibilityFee);
        proposals[_proposalId].visibilityFee += _visibilityFee;
        Proposal memory p = proposals[_proposalId];
        emit ProposalSet(p.topic, _proposalId, p.txHash, p.visibilityFee);
    }

    function getProposal(uint _proposalId)
        public
        constant
        returns (
            bytes32 topic,
            bytes32 txHash,
            bool approved
        )
    {
        Proposal memory p = proposals[_proposalId];
        return (p.topic, p.txHash, p.result == Vote.Approve);
    } 

    function getProposalTxHash(uint _proposalId) 
        public
        constant
        returns(bytes32)
    {
        return proposals[_proposalId].txHash;
    }

    function voteProposal(uint _proposalId, Vote _vote) 
        public
    {
        Proposal storage proposal = proposals[_proposalId];
        require(block.number >= proposal.blockStart);
        if (_vote == Vote.Veto) {
            require(block.number <= proposal.vetoBlockEnd);
        } else {
            require(block.number <= proposal.voteBlockEnd);
        }

        proposal.voteMap[msg.sender] = _vote;

    }

    function tabulateVote(uint _proposalId, address _delegator) 
        public
    {
        Proposal storage proposal = proposals[_proposalId];
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

    function tabulateVeto(uint _proposalId, address _delegator)
        public
    {
        Proposal storage proposal = proposals[_proposalId];
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

    function finalResult(uint _proposalId)
        public
    {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.vetoBlockEnd + tabulationBlockDelay > block.number);
        require(proposal.result == Vote.Null);
        uint256 totalTokens = token.totalSupplyAt(proposal.vetoBlockEnd);
        uint256 approvals = proposal.results[uint8(Vote.Approve)];
        uint256 vetos = proposal.results[uint8(Vote.Veto)];
        uint256 approvalQuorum = (totalTokens / 2);
        uint256 vetoQuorum = (totalTokens / 3);
        if (vetos >= vetoQuorum) {
            proposal.result = Vote.Veto;
        } else if(approvals >= approvalQuorum) {
            proposal.result = Vote.Approve;
        } else {
            proposal.result = Vote.Reject;
        }
        emit ProposalResult(_proposalId, proposal.result);
    }

}