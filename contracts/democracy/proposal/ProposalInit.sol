pragma solidity >=0.5.0 <0.6.0;

import "./ProposalAbstract.sol";

/**
 * @title Proposal
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * @dev Initialization of Proposal, used in Instance construtor. 
 */
contract ProposalInit is ProposalAbstract {

    constructor() public {
        token = MiniMeToken(address(-1));
    }

    function createProposal(
        MiniMeToken _token,
        Delegation _delegation,
        bytes32 _dataHash,
        uint256 _tabulationBlockDelay,
        uint256 _blockStart,
        uint256 _blockEndDelay,
        Proposal.QuorumType _quorum
    )
        external
    {
        require(address(token) == address(0), "Already initialized");
        delegation = _delegation;
        token = _token;
        tabulationBlockDelay = _tabulationBlockDelay;
        dataHash = _dataHash;
        blockStart = _blockStart;
        voteBlockEnd = blockStart + _blockEndDelay;
        quorum = _quorum;
    }

    function voteSigned(bytes32) external{}
    function voteDirect(Vote) external{}
    function tabulateDirect(address ) external{}
    function tabulateSigned(Vote, uint256, bytes32[] calldata, bytes calldata) external{}
    function tabulateDelegated(address) external{}
    function precomputeDelegation(address, bool) external{}
    function finalize() external{}
    function clear() external{}
    function isApproved() external view returns (bool){}
    function isFinalized() external view returns (bool){}
    function getVoteHash(Vote) external view returns (bytes32){}


}