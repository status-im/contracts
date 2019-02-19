pragma solidity >=0.5.0 <0.6.0;

import "../common/Controlled.sol";
import "../common/MessageSigned.sol";
import "../common/MerkleProof.sol";
import "../token/MiniMeToken.sol";
import "./Delegation.sol";
import "./TrustNetworkInterface.sol";

/**
 * @title Proposal
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * Store votes and tabulate results for Democracy  
 */
contract Proposal is Controlled, MessageSigned {
    MiniMeToken public token;
    Delegation public delegation;
    uint256 public tabulationBlockDelay;
    
    bytes32 topic; 
    bytes32 txHash;
    uint blockStart;
    uint voteBlockEnd;

    //votes storage
    bytes32[] signatures;
    mapping(address => Vote) voteMap;

    //tabulation process 
    uint256 lastTabulationBlock;
    mapping(address => address) tabulated;
    mapping(uint8 => uint256) results;

    Vote result;
    

    enum Vote { 
        Null,
        Reject, 
        Approve
    }

    constructor(
        MiniMeToken _token,
        Delegation _delegation,
        bytes32 _topic,
        bytes32 _txHash,
        uint256 _tabulationBlockDelay,
        uint256 _blockStart,
        uint256 _blockEndDelay
    ) 
        public

    {
        delegation = _delegation;
        token = _token;
        tabulationBlockDelay = _tabulationBlockDelay;
        topic = _topic;
        txHash = _txHash;
        blockStart = _blockStart;
        voteBlockEnd = blockStart + _blockEndDelay;
    }

    function vote(bytes32 _signatures)
        external
    {
        require(block.number >= blockStart, "Voting not started");
        require(block.number <= voteBlockEnd, "Voting ended");
        signatures.push(_signatures);
    } 

    function vote(Vote _vote) 
        external
    {
        require(block.number >= blockStart, "Voting not started");
        require(block.number <= voteBlockEnd, "Voting ended");
        voteMap[msg.sender] = _vote;

    }

    function tabulate(Vote _vote, uint256 _position, bytes32[] calldata _proof, bytes calldata _signature) 
        external
    {
        require(MerkleProof.verifyProof(_proof, signatures[_position], keccak256(_signature)), "Invalid proof");
        address _voter = recoverAddress(keccak256(abi.encodePacked(address(this), _vote)), _signature);
        voteMap[_voter] = _vote;
        _tabulate(_voter);
    }

    function tabulate(address _voter) 
        external
    {
        _tabulate(_voter);
    }

    function _tabulate(address _voter) 
        internal
    {
        require(block.number > voteBlockEnd, "Voting running");
        address _claimer = _voter;
        Vote _vote = voteMap[_claimer];
        if(_vote == Vote.Null) { //not voted, can be claimed by delegate
            _claimer = delegation.delegationOfAt(_voter, voteBlockEnd);
            _vote = voteMap[_claimer]; //loads delegate vote.
            _claimer = _voter; // try finding first delegate from chain which voted
            while(_vote == Vote.Null) {
                _claimer = delegation.delegatedToAt(_claimer, voteBlockEnd);    
                _vote = voteMap[_claimer]; //loads delegate vote.
            }
        }

        require(_vote != Vote.Null, "Cannot be Vote.Null");
        uint256 voterBalance = token.balanceOfAt(_voter, voteBlockEnd);
        address currentClaimer = tabulated[_voter];
        if(currentClaimer != address(0))
        {
            require(currentClaimer != _voter, "Voter already tabulated");
            require(currentClaimer != _claimer, "Claimer already tabulated");
            Vote oldVote = voteMap[currentClaimer];
            require(oldVote != _vote, "Doesn't changes tabulation");
            results[uint8(oldVote)] -= voterBalance;
        }
        tabulated[_voter] = _claimer;
        results[uint8(_vote)] += voterBalance;
        lastTabulationBlock = block.number;
    }

    function finalize()
        external
    {
        require(block.number > voteBlockEnd, "Voting running");
        require(lastTabulationBlock + tabulationBlockDelay > block.number, "Tabulation running");
        require(result == Vote.Null, "Already finalized");
        uint256 totalTokens = token.totalSupplyAt(voteBlockEnd);
        uint256 approvals = results[uint8(Vote.Approve)];
        uint256 rejects = results[uint8(Vote.Reject)];
        uint256 approvalQuorum = (totalTokens / 2);
        if(approvals-rejects >= approvalQuorum) {
            result = Vote.Approve;
        } else {
            result = Vote.Reject;
        }
    }

    function clear() 
        external
        onlyController 
    {
        require(result != Vote.Null, "Not finalized");
        selfdestruct(controller);
    }

}