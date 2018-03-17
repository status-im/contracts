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
    uint256 public tabulationBlockDelay = 10000;

    Proposal[]  proposals;
    
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
     
    function ProposalManager(MiniMeToken _SNT, TrustNetwork _trustNet, address _stakeBank) public {
        trustNet = _trustNet;
        SNT = _SNT;
    }

    function addProposal(bytes32 _topic, bytes32 _txHash, uint _stake) public returns (uint) {
        require(_stake > 1000);
        require(SNT.transferFrom(msg.sender, address(this), _stake));
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

    function execute(uint id, address dest, uint value, bytes data) public {
        Proposal memory p = proposals[id];
        require(p.approved == true);
        require(keccak256(dest, value, data) == p.txHash);
        proposals[id].executed = true;
        ProposalExecutor(controller).executeProposal(dest, value, data);
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
            DelegationProxy voteDelegation;
            DelegationProxy vetoDelegation;
            (voteDelegation, vetoDelegation) = trustNet.getTopic(proposal.topic);
            address delegate = voteDelegation.delegationOfAt(_delegator, proposal.vetoBlockEnd);
            _vote = proposal.voteMap[delegate];
        }

        if (_vote == Vote.Reject || _vote == Vote.Approve) {
            proposal.results[uint8(_vote)] += MiniMeToken(SNT).balanceOfAt(_delegator, proposal.voteBlockEnd);
        }
    }

    function tabulateVeto(uint _proposal, address _delegator) public {
        Proposal storage proposal = proposals[_proposal];
        require(block.number > proposal.vetoBlockEnd);
        require(!proposal.tabulated[_delegator].veto);
        proposal.tabulated[_delegator].veto = true;
        Vote _vote = proposal.voteMap[_delegator];
        if (_vote == Vote.Null) {
            DelegationProxy voteDelegation;
            DelegationProxy vetoDelegation;
            (voteDelegation, vetoDelegation) = trustNet.getTopic(proposal.topic);
            address delegate = vetoDelegation.delegationOfAt(_delegator, proposal.vetoBlockEnd);
            _vote = proposal.voteMap[delegate];
        }

        if (_vote == Vote.Veto) {
            proposal.results[uint8(Vote.Veto)] += MiniMeToken(SNT).balanceOfAt(_delegator, proposal.vetoBlockEnd);
        }
        
    }

    function approve(uint _proposal) public {
        Proposal storage proposal = proposals[_proposal];
        require(proposal.vetoBlockEnd + tabulationBlockDelay > block.number);
        require(!proposal.approved);
        uint256 totalTokens = MiniMeToken(SNT).totalSupplyAt(proposal.vetoBlockEnd);
        uint256 approvals = proposal.results[uint8(Vote.Approve)];
        uint256 veto = proposal.results[uint8(Vote.Veto)];
        uint256 approvalQuorum = (totalTokens / 2);
        uint256 vetoQuorum = (totalTokens / 3);
        require(veto < vetoQuorum); 
        require(approvals >= approvalQuorum);
        proposal.approved = true;
        require(SNT.transferFrom(address(this), proposal.staker, proposal.stake));
    }
}