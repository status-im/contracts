pragma solidity >=0.5.0 <0.6.0;

import "./ProposalAbstract.sol";

/**
 * @title Proposal
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * Store votes and tabulate results for Democracy  
 */
contract ProposalInit is ProposalAbstract {

    constructor() public {
        token = MiniMeToken(address(-1));
    }

    function createProposal(
        MiniMeToken _token,
        Delegation _delegation,
        bytes32 _topic,
        bytes32 _txHash,
        uint256 _tabulationBlockDelay,
        uint256 _blockStart,
        uint256 _blockEndDelay
    ) 
        external
    {
        require(address(token) == address(0), "Already initialized");
        delegation = _delegation;
        token = _token;
        tabulationBlockDelay = _tabulationBlockDelay;
        topic = _topic;
        txHash = _txHash;
        blockStart = _blockStart;
        voteBlockEnd = blockStart + _blockEndDelay;
    }



}