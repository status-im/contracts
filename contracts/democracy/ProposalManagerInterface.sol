pragma solidity ^0.4.21;

import "../token/MiniMeTokenInterface.sol";
import "./TrustNetworkInterface.sol";
import "./DelegationProxyInterface.sol";
import "./FeeCollector.sol";
/**
 * @title ProposalManagerInterface
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 */
contract ProposalManagerInterface {

    struct Proposal {
        bytes32 topic; 
        bytes32 txHash;

        uint visibilityFee;

        uint blockStart;
        uint voteBlockEnd;
        uint vetoBlockEnd;

        mapping(address => Vote) voteMap;
        mapping(address => Tabulations) tabulated;
        mapping(uint8 => uint256) results;
        
        Vote result;
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
    
    TrustNetworkInterface public trustNet;
    MiniMeTokenInterface public token;
    FeeCollector public feeCollector;
    uint256 public tabulationBlockDelay;
    uint256 public minVisibilityFee = 1000;
    Proposal[] public proposals;
    
    event ProposalSet(bytes32 indexed topic, uint256 _proposalId, bytes32 _txHash, uint256 _visibility);
    event ProposalResult(uint256 _proposalId, Vote finalResult);

    function addProposal(bytes32 _topic, bytes32 _txHash, uint _visibilityFee) public returns (uint);
    function getProposal(uint _id) public view returns (bytes32 topic, bytes32 txHash, bool approved);
    function voteProposal(uint _proposal, Vote _vote) public;
    function tabulateVote(uint _proposal, address _delegator) public;
    function tabulateVeto(uint _proposal, address _delegator) public;
    function finalResult(uint _proposalId) public;
}