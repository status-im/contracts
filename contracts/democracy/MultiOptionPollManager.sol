pragma solidity ^0.4.21;

import "../common/Controlled.sol";
import "../token/MiniMeTokenInterface.sol";
import "../token/MiniMeTokenFactory.sol";

/**
 * @title PollManager
 * @author Richard Ramos (Status Research & Development GmbH)
 */
contract MultiOptionPollManager is Controlled {
    event PollCreated(uint256 pollId, uint8 numOptions);
    event PollCanceled(uint256 pollId);
    event Voted(address voter, uint8[] votes);

    MiniMeTokenFactory public tokenFactory;
    MiniMeTokenInterface public token;
    
    Poll[] public polls;

    struct Vote {
        mapping(uint8 => uint8) distribution;
        bool voted;
    }

    struct Poll {
        uint start;
        uint end;
        uint8 numOptions;
        address[] voters;
        mapping(address => Vote) voteMap;
        uint256[] results;
        address token;
        bool cancelled;
    }
    
    constructor(address _tokenFactory, address _token) 
        public
    {
        tokenFactory = MiniMeTokenFactory(_tokenFactory);
        token = MiniMeTokenInterface(_token);
    }

    function createPoll(
        uint _blocksUntilVotingStart,
        uint _voteDuration,
        uint8 _numOptions
    )
        public
        onlyController
        returns (uint pollId)
    {
        pollId = polls.length++;
        
        Poll storage p = polls[pollId];
        
        p.cancelled = false;
        p.start = block.number + _blocksUntilVotingStart;
        p.end = p.start + _voteDuration;
        p.numOptions = _numOptions;
        p.token = tokenFactory.createCloneToken(
                        token,
                        p.start - 1,
                        "VotingToken",
                        MiniMeToken(token).decimals(),
                        "VTN",
                        true);


        emit PollCreated(pollId, _numOptions);
    }

    function vote(uint _pollId, uint8[] _vote) 
        public
    {
        Poll storage poll = polls[_pollId];

        require(block.number >= poll.start);
        require(block.number <= poll.end);
        require(_vote.length == poll.numOptions);
        require(!poll.voteMap[msg.sender].voted);
        require(!poll.cancelled);

        uint8 percentage = 0;

        for(uint8 i = 0; i < poll.numOptions; i++){
            poll.results[i] = (MiniMeTokenInterface(poll.token).balanceOf(msg.sender) * _vote[i]) / 100; 
            percentage += _vote[i];
            poll.voteMap[msg.sender].distribution[i] = _vote[i];
        }

        require(percentage == 100);
        
        poll.voteMap[msg.sender].voted = true;
        poll.voters.push(msg.sender);

        emit Voted(msg.sender, _vote);
    }

    function getPollCount()
        public
        view
        returns (uint256)
    {
        return polls.length;
    }

    function exists(uint _pollId)
        public 
        view
        returns (bool) {
        return polls.length != 0 && polls[_pollId].start != 0;
    }

    function getPollResults(uint _pollId) 
        external 
        view 
        returns (uint256[]){
        return polls[_pollId].results;
    }
    
    function hasVotesRecorded(uint256 _pollId)
        external
        view
        returns (bool)
    {
        return polls[_pollId].voters.length > 0;
    }

    function isVotingAvailable(uint _pollId) public view returns (bool){
        Poll memory p = polls[_pollId];
        return p.end > block.number;
    }
    
    function cancel(uint _pollId) onlyController {
        require(polls[_pollId].start > 0);
        require(polls[_pollId].end < block.number);
        
        Poll storage p = polls[_pollId];
        p.cancelled = true;

        emit PollCanceled(_pollId);
    }
    
}