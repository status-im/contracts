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

        mapping(address => Vote) voteMap;

        mapping(address => bool) tabulated;
        
        mapping(uint8 => uint256) results;
        
        bool approved;
        bool executed;
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
        require(p.approved == true);
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

        proposal.voteMap[msg.sender] = _vote;

    }

   function tabulate(uint _proposal, address _delegator) public {
        Proposal storage proposal = proposals[_proposal];
        require(block.number > proposal.vetoBlockEnd);

        DelegationProxy voteDelegation;
        DelegationProxy vetoDelegation;
        (voteDelegation, vetoDelegation) = trustNet.getTopic(proposal.topic);
        
        Vote _vote = proposal.voteMap[vetoDelegation.delegationOfAt(_delegator, proposal.vetoBlockEnd)];
        if (_vote != Vote.Veto) {
            _vote = proposal.voteMap[voteDelegation.delegationOfAt(_delegator, proposal.voteBlockEnd)];
        }

        if (_vote == Vote.Reject || _vote == Vote.Approve) {
            proposal.results[uint8(_vote)] += MiniMeToken(SNT).balanceOfAt(_delegator, proposal.voteBlockEnd);
        } else {
            proposal.results[uint8(_vote)] += MiniMeToken(SNT).balanceOfAt(_delegator, proposal.vetoBlockEnd);
        }

   }
   
   function approve(uint _proposal) public {
       Proposal storage proposal = proposals[_proposal];
       uint256 totalTokens = MiniMeToken(SNT).totalSupplyAt(proposal.vetoBlockEnd);
       uint256 approved = proposal.results[uint8(Vote.Approve)];
       uint256 veto = proposal.results[uint8(Vote.Veto)];
       require (approved > veto);
       if (approved > (totalTokens / 2)) {
           proposal.approved = true;
       }
   }
}