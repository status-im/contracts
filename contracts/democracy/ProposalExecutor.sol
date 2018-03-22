pragma solidity ^0.4.17;

contract ProposalExecutor {
    function executeProposal(address topic, uint value, bytes data) external returns (bool success);
}