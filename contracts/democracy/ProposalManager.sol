pragma solidity >=0.5.0 <0.6.0;

import "../common/Controlled.sol";
import "../common/MessageSigned.sol";
import "../token/MiniMeToken.sol";
import "./Delegation.sol";
import "./TrustNetworkInterface.sol";

/**
 * @title ProposalManager
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * Store the proposals, votes and tabulate results for Democracy  
 */
contract ProposalManager is Controlled, MessageSigned {
    event ProposalSet(bytes32 indexed topic, uint256 proposalId, bytes32 txHash);
    event ProposalResult(uint256 proposalId, uint8 finalResult);

    MiniMeToken public token;
    TrustNetworkInterface public trustNet;
    uint256 public tabulationBlockDelay;
    Proposal[] public proposals;
    
    struct Proposal {
        bytes32 topic; 
        bytes32 txHash;

        uint blockStart;
        uint voteBlockEnd;

        bytes32[] signatures;
        mapping(address => Vote) voteMap;

        mapping(address => address) tabulated;
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
        MiniMeToken _token,
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

        p.blockStart = block.number + 1000; //will be replaced by configurations
        p.voteBlockEnd = p.blockStart + 10000; //dummy value
        emit ProposalSet(_topic, proposalId, _txHash);
    }

    function voteProposal(uint _proposalId, bytes32 _signatures)
        public
    {
        Proposal storage proposal = proposals[_proposalId];
        require(block.number >= proposal.blockStart, "Voting not started");
        require(block.number <= proposal.voteBlockEnd, "Voting ended");
        proposal.signatures.push(_signatures);
    } 

    function voteProposal(uint _proposalId, Vote _vote) 
        public
    {
        Proposal storage proposal = proposals[_proposalId];
        require(block.number >= proposal.blockStart, "Voting not started");
        require(block.number <= proposal.voteBlockEnd, "Voting ended");
        proposal.voteMap[msg.sender] = _vote;

    }


    function tabulateVote(uint _proposalId, Vote _vote, uint256 _position, bytes32[] calldata _proof, bytes calldata _signature) 
        external
    {
        Proposal storage proposal = proposals[_proposalId];
        require(block.number > proposal.voteBlockEnd, "Voting running");
        
        
        bytes32 merkleHash = keccak256(abi.encodePacked(_signature));
        for (uint256 index = 0; index < _proof.length; index++) {
            merkleHash = keccak256(abi.encodePacked(merkleHash, _proof[index]));
        }
        require(proposal.signatures[_position] == merkleHash, "Invalid proof");
        address _voter = recoverAddress(keccak256(abi.encodePacked(address(this),_proposalId,_vote)), _signature);
        require(proposal.tabulated[_voter] == address(0), "Address already tabulated");
        
        proposal.results[uint8(_vote)] += token.balanceOfAt(_voter, proposal.voteBlockEnd);

        proposal.lastTabulationTimestamp = block.timestamp;

    }

    function tabulateVote(uint _proposalId, address _delegator) 
        public
    {
        Proposal storage proposal = proposals[_proposalId];
        require(block.number > proposal.voteBlockEnd);
        require(proposal.tabulated[_delegator] == address(0), "Already tabulated");
        Vote _vote = proposal.voteMap[_delegator];
        if(_vote == Vote.Null) { //not voted, can be claimed by delegate
            address delegate = trustNet.getVoteDelegation(proposal.topic).delegationOfAt(_delegator, proposal.voteBlockEnd);
            proposal.tabulated[_delegator] = delegate;
            _vote = proposal.voteMap[delegate];
        } else { //voted by themselves
            proposal.tabulated[_delegator] = _delegator;
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

    function getProposal(uint _proposalId)
        external
        view
        returns (
            bytes32 topic,
            bytes32 txHash,
            bool approved
        )
    {
        Proposal memory p = proposals[_proposalId];
        return (p.topic, p.txHash, p.result == Vote.Approve);
    } 

}