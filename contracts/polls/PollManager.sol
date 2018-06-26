pragma solidity ^0.4.23;

import "../common/Controlled.sol";
import "./LowLevelStringManipulator.sol";
import "../token/MiniMeToken.sol";

contract IPollContract {
    function deltaVote(int _amount, bytes32 _ballot) returns (bool _succes);
    function pollType() constant returns (bytes32);
    function question() constant returns (string);
}

contract IPollFactory {
    function create(bytes _description) returns(address);
}

contract PollManager is LowLevelStringManipulator, Controlled {

    struct VoteLog {
        bytes32 ballot;
        uint amount;
    }

    struct Poll {
        uint startBlock;
        uint endBlock;
        address token;
        address pollContract;
        bool canceled;
        uint voters;
        mapping(bytes32 => uint) votersPerBallot;
        mapping(address => VoteLog) votes;
    }

    Poll[] _polls;

    MiniMeTokenFactory public tokenFactory;
    MiniMeToken public token;

    function PollManager(address _tokenFactory, address _token) 
        public {
        tokenFactory = MiniMeTokenFactory(_tokenFactory);
        token = MiniMeToken(_token);
    }

    modifier onlySNTHolder {
        // TODO: require min number of tokens?
        require(token.balanceOf(msg.sender) > 0); 
        _; 
    }

    function addPoll(
        uint _startBlock,
        uint _endBlock,
        address _pollFactory,
        bytes _description)
        onlySNTHolder
        returns (uint _idPoll)
    {
        if (_endBlock <= _startBlock) throw;
        if (_endBlock <= getBlockNumber()) throw;
        _idPoll = _polls.length;
        _polls.length ++;
        Poll p = _polls[ _idPoll ];
        p.startBlock = _startBlock;
        p.endBlock = _endBlock;
        p.voters = 0;

        var (name, symbol) = getTokenNameSymbol(address(token));
        string memory proposalName = strConcat(name, "_", uint2str(_idPoll));
        string memory proposalSymbol = strConcat(symbol, "_", uint2str(_idPoll));

        p.token = tokenFactory.createCloneToken(
            address(token),
            _startBlock - 1,
            proposalName,
            token.decimals(),
            proposalSymbol,
            true);


        p.pollContract = IPollFactory(_pollFactory).create(_description);

        if (p.pollContract == 0) throw;

        emit PollCreated(_idPoll); 
    }

    function cancelPoll(uint _idPoll) onlyController {
        if (_idPoll >= _polls.length) throw;
        Poll p = _polls[_idPoll];
        if (getBlockNumber() >= p.endBlock) throw;
        p.canceled = true;
        PollCanceled(_idPoll);
    }

    function canVote(uint _idPoll) public view returns(bool) {
        if(_idPoll >= _polls.length) return false;

        Poll storage p = _polls[_idPoll];
        uint balance = MiniMeToken(p.token).balanceOf(msg.sender);

        return block.number >= p.startBlock && 
                block.number <= p.endBlock && 
               !p.canceled && 
               balance != 0;
    }

    function vote(uint _idPoll, bytes32 _ballot) {
        if (_idPoll >= _polls.length) throw;
        Poll p = _polls[_idPoll];
        if (getBlockNumber() < p.startBlock) throw;
        if (getBlockNumber() >= p.endBlock) throw;
        if (p.canceled) throw;

        unvote(_idPoll);

        uint amount = MiniMeToken(p.token).balanceOf(msg.sender);

        if (amount == 0) throw;


//        enableTransfers = true;
        if (!MiniMeToken(p.token).transferFrom(msg.sender, address(this), amount)) throw;
//        enableTransfers = false;

        p.votes[msg.sender].ballot = _ballot;
        p.votes[msg.sender].amount = amount;
        
        p.voters++;

        p.votersPerBallot[_ballot]++;

        if (!IPollContract(p.pollContract).deltaVote(int(amount), _ballot)) throw;

        Vote(_idPoll, msg.sender, _ballot, amount);
    }

    function unvote(uint _idPoll) {
        if (_idPoll >= _polls.length) throw;
        Poll p = _polls[_idPoll];
        if (getBlockNumber() < p.startBlock) throw;
        if (getBlockNumber() >= p.endBlock) throw;
        if (p.canceled) throw;

        uint amount = p.votes[msg.sender].amount;
        bytes32 ballot = p.votes[msg.sender].ballot;
        if (amount == 0) return;

        if (!IPollContract(p.pollContract).deltaVote(-int(amount), ballot)) throw;

        p.votes[msg.sender].ballot = 0;
        p.votes[msg.sender].amount = 0;
        p.votersPerBallot[ballot]--;

        p.voters--;

//        enableTransfers = true;
        if (!MiniMeToken(p.token).transferFrom(address(this), msg.sender, amount)) throw;
//        enableTransfers = false;

        Unvote(_idPoll, msg.sender, ballot, amount);
    }

// Constant Helper Function

    function nPolls() constant returns(uint) {
        return _polls.length;
    }

    function poll(uint _idPoll) constant returns(
        uint _startBlock,
        uint _endBlock,
        address _token,
        address _pollContract,
        bool _canceled,
        bytes32 _pollType,
        string _question,
        bool _finalized,
        uint _totalCensus,
        uint _voters
    ) {
        if (_idPoll >= _polls.length) throw;
        Poll p = _polls[_idPoll];
        _startBlock = p.startBlock;
        _endBlock = p.endBlock;
        _token = p.token;
        _pollContract = p.pollContract;
        _canceled = p.canceled;
        _pollType = IPollContract(p.pollContract).pollType();
        _question = getString(p.pollContract, bytes4(sha3("question()")));
        _finalized = (!p.canceled) && (getBlockNumber() >= _endBlock);
        _totalCensus = MiniMeToken(p.token).totalSupply();
        _voters = p.voters;
    }

    function getVote(uint _idPoll, address _voter) constant returns (bytes32 _ballot, uint _amount) {
        if (_idPoll >= _polls.length) throw;
        Poll p = _polls[_idPoll];

        _ballot = p.votes[_voter].ballot;
        _amount = p.votes[_voter].amount;
    }

    function getVotesByBallot(uint _idPoll, bytes32 _ballot)
        public view returns(uint voters, uint votes) {
        if (_idPoll >= _polls.length) throw;
        Poll storage p = _polls[_idPoll];

        voters = p.votersPerBallot[_ballot];
        votes = p.votersPerBallot[_ballot];

    }

    function proxyPayment(address ) payable returns(bool) {
        return false;
    }


    function onTransfer(address , address , uint ) returns(bool) {
        return true;
    }

    function onApprove(address , address , uint ) returns(bool) {
        return true;
    }


    function getBlockNumber() internal constant returns (uint) {
        return block.number;
    }

    event Vote(uint indexed idPoll, address indexed _voter, bytes32 ballot, uint amount);
    event Unvote(uint indexed idPoll, address indexed _voter, bytes32 ballot, uint amount);
    event PollCanceled(uint indexed idPoll);
    event PollCreated(uint indexed idPoll);



}
