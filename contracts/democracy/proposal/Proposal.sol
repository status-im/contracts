pragma solidity >=0.5.0 <0.6.0;

/**
 * @title Proposal
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)  
 */
interface Proposal {
    event VoteSignatures(uint256 position, bytes32 merkleTree);
    event Voted(Vote indexed vote, address voter);
    event PartialResult(Vote indexed vote, uint256 total);
    event Claimed(Vote indexed vote, address claimer, address source);
    
    enum Vote { 
        Null,
        Reject, 
        Approve
    }
    
    /**
     * Quorum types:
     * - qualified majority 60% + 1 of all influence (change rules)
     * - absolute majority: 50% + 1 of all influence (agregate rules)
     * - simple majority: 50% +1 of participants influence  (non critical changes)
    */
    enum QuorumType {
        Qualified, //60% of all influence
        Absolute, //50% of all influence
        Simple //simple present majority
    }

    function voteSigned(bytes32 _signatures) external;
    function voteDirect(Vote _vote) external;
    function tabulateDirect(address _voter) external;
    function tabulateSigned(Vote _vote, uint256 _position, bytes32[] calldata _proof, bytes calldata _signature) external;
    function tabulateDelegated(address _voter) external;
    function precomputeDelegation(address _start, bool _clean) external;
    function finalize() external;
    function clear() external;
    function isApproved() external view returns (bool);
    function isFinalized() external view returns (bool);
    function getVoteHash(Vote _vote) external view returns (bytes32);


}