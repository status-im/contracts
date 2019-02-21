pragma solidity >=0.5.0 <0.6.0;

/**
 * @title Proposal
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * Store votes and tabulate results for Democracy  
 */
interface Proposal {

    enum Vote { 
        Null,
        Reject, 
        Approve
    }


    function voteSigned(bytes32 _signatures) external;

    function voteDirect(Vote _vote) external;

    function tabulateDirect(address _voter) external;

    function tabulateSigned(Vote _vote, uint256 _position, bytes32[] calldata _proof, bytes calldata _signature) external;

    function tabulateDelegated(address _voter) external;

    function precomputeDelegation(address _start, bool _clean) external;

    function finalize() external;

    function clear() external;



}