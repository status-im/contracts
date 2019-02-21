pragma solidity >=0.5.0 <0.6.0;

import "../../common/MessageSigned.sol";
import "../../common/MerkleProof.sol";
import "./ProposalAbstract.sol";

/**
 * @title Proposal
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * Store votes and tabulate results for Democracy  
 */
contract ProposalBase is ProposalAbstract, MessageSigned {


    constructor() 
        public
    {
        blockStart =  uint256(-1);
        voteBlockEnd = uint256(-1);
    }

    function voteSigned(bytes32 _signatures)
        external
    {
        require(block.number >= blockStart, "Voting not started");
        require(block.number <= voteBlockEnd, "Voting ended");
        signatures.push(_signatures);
    } 

    function voteDirect(Vote _vote)
        external
    {
        require(block.number >= blockStart, "Voting not started");
        require(block.number <= voteBlockEnd, "Voting ended");
        voteMap[msg.sender] = _vote;
    } 

    function tabulateDirect(address _voter) 
        external
    {
        require(block.number > voteBlockEnd, "Voting running");
        Vote vote = voteMap[_voter];
        require(vote != Vote.Null, "Not voted");
        setTabulation(_voter, _voter, vote );
    }


    function tabulateSigned(Vote _vote, uint256 _position, bytes32[] calldata _proof, bytes calldata _signature) 
        external
    {
        require(block.number > voteBlockEnd, "Voting running");
        require(MerkleProof.verifyProof(_proof, signatures[_position], keccak256(_signature)), "Invalid proof");
        address _voter = recoverAddress(keccak256(abi.encodePacked(address(this), _vote)), _signature);
        require(voteMap[_voter] == Vote.Null, "Already tabulated");
        voteMap[_voter] = _vote;
        setTabulation(_voter, _voter, _vote);
    }

    function tabulateDelegated(address _voter) 
        external
    {
        require(block.number > voteBlockEnd, "Voting running");
        (address _claimer, Vote _vote) = findNearestDelegatable(_voter); // try finding first delegate from chain which voted
        setTabulation(_voter, _claimer, _vote);
    }   

    function precomputeDelegation(address _start, bool _clean) external {
        require(block.number > voteBlockEnd, "Voting running");
        cacheDelegation(_start,_clean);
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


    function setTabulation(address _voter, address _claimer, Vote _vote) internal {
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

    function findNearestDelegatable(address _voter) internal view returns (address claimer, Vote vote){
        vote = voteMap[_voter];
        require(vote == Vote.Null, "Not delegatable");
        claimer = _voter; // try finding first delegate from chain which voted
        while(vote == Vote.Null) {
            claimer = delegationOf[claimer];
            if(claimer == address(0)){
                claimer = delegation.delegatedToAt(claimer, voteBlockEnd);  
            }
            require(claimer != address(0), "No delegate vote found");
            vote = voteMap[claimer]; //loads delegate vote.
        }
    }

    function cacheDelegation(address _delegator, bool _clean) private returns (address delegate) {
        delegate =  _delegator;
        if(voteMap[_delegator] == Vote.Null) { 
            if(!_clean) {
                delegate = delegationOf[delegate];
            }
            if(delegate == address(0)){
                delegate = delegation.delegatedToAt(_delegator, voteBlockEnd); //get delegate chain tail
            }
        }
        
        require(delegate != address(0), "No delegate vote found");
        if(voteMap[delegate] == Vote.Null) {
            delegate = cacheDelegation(delegate, _clean);
        }
        delegationOf[_delegator] = delegate;
        return delegate;
        
    }

}