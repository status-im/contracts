pragma solidity ^0.4.23;

import "../common/Controlled.sol";
import "../token/MiniMeToken.sol";



contract PollManager is Controlled {

    struct Poll {
        uint startBlock;
        uint endBlock;
        address token;
        bool canceled;
        uint voters;
        string description;
        mapping(address => uint) votes;
        uint results;
        uint qvResults;
    }

    Poll[] _polls;

    MiniMeTokenFactory public tokenFactory;
    MiniMeToken public token;

    constructor(address _tokenFactory, address _token) 
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
        uint _endBlock,
        string _description)
        public
        onlySNTHolder
        returns (uint _idPoll)
    {
        require(_endBlock > block.number);

        _idPoll = _polls.length;
        _polls.length ++;
        Poll storage p = _polls[ _idPoll ];
        p.startBlock = block.number;
        p.endBlock = _endBlock;
        p.voters = 0;
        p.description = _description;

        p.token = tokenFactory.createCloneToken(
            address(token),
            block.number - 1,
            "SNT Voting Token",
            token.decimals(),
            "SVT",
            true);

        emit PollCreated(_idPoll); 
    }

    function cancelPoll(uint _idPoll) 
        onlyController
        public 
    {
        require(_idPoll < _polls.length);

        Poll storage p = _polls[_idPoll];

        require(p.endBlock < block.number);

        p.canceled = true;
        emit PollCanceled(_idPoll);
    }

    function canVote(uint _idPoll) 
        public 
        view 
        returns(bool)
    {
        if(_idPoll >= _polls.length) return false;

        Poll storage p = _polls[_idPoll];
        uint balance = MiniMeToken(p.token).balanceOf(msg.sender);

        return block.number >= p.startBlock && 
                block.number <= p.endBlock && 
               !p.canceled && 
               balance != 0;
    }

    function sqrt(uint256 x) public pure returns (uint256 y) {
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    function vote(uint _idPoll) public {
        require(_idPoll < _polls.length);

        Poll storage p = _polls[_idPoll];

        require(block.number >= p.startBlock && block.number < p.endBlock && !p.canceled);

        unvote(_idPoll);

        uint amount = MiniMeToken(p.token).balanceOf(msg.sender);

        require(amount != 0);
        require(MiniMeToken(p.token).transferFrom(msg.sender, address(this), amount));

        p.votes[msg.sender] = amount;
        p.voters++;
        
        p.results += amount;
        p.qvResults += sqrt(amount);

        emit Vote(_idPoll, msg.sender, amount);
    }

    function customVote(uint _idPoll, uint _amount) public {
        require(_idPoll < _polls.length);

        Poll storage p = _polls[_idPoll];

        require(block.number >= p.startBlock && block.number < p.endBlock && !p.canceled);

        unvote(_idPoll);

        uint balance = MiniMeToken(p.token).balanceOf(msg.sender);

        require(balance != 0 && balance >= _amount);
        require(MiniMeToken(p.token).transferFrom(msg.sender, address(this), _amount));

        p.votes[msg.sender] = _amount;
        p.voters++;

        p.results += _amount;
        p.qvResults += sqrt(_amount);

        emit Vote(_idPoll, msg.sender, _amount);
    }

    function unvote(uint _idPoll) public {
        require(_idPoll < _polls.length);
        Poll storage p = _polls[_idPoll];
        
        require(block.number >= p.startBlock && block.number < p.endBlock && !p.canceled);

        uint amount = p.votes[msg.sender];
        if (amount == 0) return;

        p.votes[msg.sender] = 0;

        p.voters--;
        p.results -= amount;
        p.qvResults -= sqrt(amount);

        require(MiniMeToken(p.token).transferFrom(address(this), msg.sender, amount));

        emit Unvote(_idPoll, msg.sender, amount);
    }

// Constant Helper Function

    function nPolls()
        public
        view 
        returns(uint)
    {
        return _polls.length;
    }

    function poll(uint _idPoll)
        public 
        view 
        returns(
        uint _startBlock,
        uint _endBlock,
        address _token,
        bool _canceled,
        string _description,
        bool _finalized,
        uint _totalCensus,
        uint _voters,
        uint _results,
        uint _qvResults
    )
    {
        require(_idPoll < _polls.length);

        Poll storage p = _polls[_idPoll];

        _startBlock = p.startBlock;
        _endBlock = p.endBlock;
        _token = p.token;
        _canceled = p.canceled;
        _description = p.description;
        _finalized = (!p.canceled) && (block.number >= _endBlock);
        _totalCensus = MiniMeToken(p.token).totalSupply();
        _voters = p.voters;
        _results = p.results;
        _qvResults = p.qvResults;
    }

    function getVote(uint _idPoll, address _voter) 
        public 
        view 
        returns (uint)
    {
        require(_idPoll < _polls.length);

        Poll storage p = _polls[_idPoll];
        return p.votes[_voter];
    }

    function proxyPayment(address ) 
        payable 
        returns(bool) {
        return false;
    }


    function onTransfer(address , address , uint ) 
        public
        pure
        returns(bool) 
    {
        return true;
    }

    function onApprove(address , address , uint ) 
        public 
        pure
        returns(bool) {
        return true;
    }

    event Vote(uint indexed idPoll, address indexed _voter, uint amount);
    event Unvote(uint indexed idPoll, address indexed _voter, uint amount);
    event PollCanceled(uint indexed idPoll);
    event PollCreated(uint indexed idPoll);
}
