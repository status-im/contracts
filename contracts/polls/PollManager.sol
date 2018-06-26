pragma solidity ^0.4.23;

import "../common/Controlled.sol";
import "./LowLevelStringManipulator.sol";
import "../token/MiniMeToken.sol";
import "./IPollFactory.sol";
import "./SingleChoiceFactory.sol";



contract IPollContract {
    function deltaVote(int _amount, bytes32 _ballot) public returns (bool _succes);
    function pollType() public constant returns (bytes32);
    function question() public constant returns (string);
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
    IPollFactory pollFactory;

    MiniMeTokenFactory public tokenFactory;
    MiniMeToken public token;

    constructor(address _tokenFactory, address _token) 
        public {
        tokenFactory = MiniMeTokenFactory(_tokenFactory);
        token = MiniMeToken(_token);
        pollFactory = IPollFactory(new SingleChoiceFactory());
    }

    modifier onlySNTHolder {
        // TODO: require min number of tokens?
        require(token.balanceOf(msg.sender) > 0); 
        _; 
    }

    function addPoll(
        uint _startBlock,
        uint _endBlock,
        bytes _description)
        public
        onlySNTHolder
        returns (uint _idPoll)
    {
        require(_endBlock > _startBlock && _endBlock > block.number);

        _idPoll = _polls.length;
        _polls.length ++;
        Poll storage p = _polls[ _idPoll ];
        p.startBlock = _startBlock;
        p.endBlock = _endBlock;
        p.voters = 0;

        string memory name;
        string memory symbol;
        (name, symbol) = getTokenNameSymbol(address(token));

        string memory proposalName = strConcat(name, "_", uint2str(_idPoll));
        string memory proposalSymbol = strConcat(symbol, "_", uint2str(_idPoll));

        p.token = tokenFactory.createCloneToken(
            address(token),
            _startBlock - 1,
            proposalName,
            token.decimals(),
            proposalSymbol,
            true);

        p.pollContract = pollFactory.create(_description);

        require(p.pollContract != 0);

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

    function vote(uint _idPoll, bytes32 _ballot) public {
        require(_idPoll < _polls.length);

        Poll storage p = _polls[_idPoll];

        require(block.number >= p.startBlock && block.number < p.endBlock && !p.canceled);

        unvote(_idPoll);

        uint amount = MiniMeToken(p.token).balanceOf(msg.sender);

        require(amount != 0);
        require(MiniMeToken(p.token).transferFrom(msg.sender, address(this), amount));

        p.votes[msg.sender].ballot = _ballot;
        p.votes[msg.sender].amount = amount;
        
        p.voters++;

        p.votersPerBallot[_ballot]++;

        require(IPollContract(p.pollContract).deltaVote(int(amount), _ballot));

        emit Vote(_idPoll, msg.sender, _ballot, amount);
    }

    function unvote(uint _idPoll) public {
        require(_idPoll < _polls.length);
        Poll storage p = _polls[_idPoll];
        
        require(block.number >= p.startBlock && block.number < p.endBlock && !p.canceled);

        uint amount = p.votes[msg.sender].amount;
        bytes32 ballot = p.votes[msg.sender].ballot;
        if (amount == 0) return;

        require(IPollContract(p.pollContract).deltaVote(-int(amount), ballot));

        p.votes[msg.sender].ballot = 0x00;
        p.votes[msg.sender].amount = 0;
        p.votersPerBallot[ballot]--;

        p.voters--;

        require(MiniMeToken(p.token).transferFrom(address(this), msg.sender, amount));

        emit Unvote(_idPoll, msg.sender, ballot, amount);
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
        address _pollContract,
        bool _canceled,
        bytes32 _pollType,
        string _question,
        bool _finalized,
        uint _totalCensus,
        uint _voters
    )
    {
        require(_idPoll < _polls.length);

        Poll storage p = _polls[_idPoll];

        _startBlock = p.startBlock;
        _endBlock = p.endBlock;
        _token = p.token;
        _pollContract = p.pollContract;
        _canceled = p.canceled;
        _pollType = IPollContract(p.pollContract).pollType();
        _question = getString(p.pollContract, bytes4(keccak256("question()")));
        _finalized = (!p.canceled) && (block.number >= _endBlock);
        _totalCensus = MiniMeToken(p.token).totalSupply();
        _voters = p.voters;
    }

    function getVote(uint _idPoll, address _voter) 
        public 
        view 
        returns (bytes32 _ballot, uint _amount)
    {
        require(_idPoll < _polls.length);

        Poll storage p = _polls[_idPoll];

        _ballot = p.votes[_voter].ballot;
        _amount = p.votes[_voter].amount;
    }

    function getVotesByBallot(uint _idPoll, bytes32 _ballot)
        public 
        view 
        returns(uint voters, uint votes) 
    {
        require(_idPoll < _polls.length);

        Poll storage p = _polls[_idPoll];

        voters = p.votersPerBallot[_ballot];
        votes = p.votersPerBallot[_ballot];

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

    event Vote(uint indexed idPoll, address indexed _voter, bytes32 ballot, uint amount);
    event Unvote(uint indexed idPoll, address indexed _voter, bytes32 ballot, uint amount);
    event PollCanceled(uint indexed idPoll);
    event PollCreated(uint indexed idPoll);
}
