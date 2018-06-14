pragma solidity ^0.4.23;

import "../common/Controlled.sol";
import "../token/MiniMeTokenInterface.sol";
import "../democracy/ProposalManager.sol";

contract TCR is Controlled {

    uint256 public constant RESULT_NULL = 0;
    uint256 public constant RESULT_REJECT = 1;
    uint256 public constant RESULT_APPROVE = 2;
    uint256 public constant RESULT_VETO = 3;

    ProposalManager public proposalManager;
    uint256 public approvalTimeLimit;
    MiniMeTokenInterface token;
    mapping (address => SubmitPrice) submitAllowances;

    bytes32 topic;

    uint votingPeriod;
    uint applicationExpiryPeriod;

    struct SubmitPrice {
        bool allowedSubmitter;
        uint256 stakePrice;
    }

    struct Proposal {
        bool whitelisted;
        address owner;
        uint256 balance;
        uint256 challengeID;
        bytes data;
        uint256 applicationExpiry;
    }

    struct Challenge {
        bool resolved; 
        uint256 rewardPool;
        address challenger;
        uint256 stake;
        uint256 totalTokens;
        mapping(address => bool) tokenClaims;
    }

    uint256 nonce;
    mapping(uint256 => Proposal) public proposals; 
    mapping(uint => Challenge) public challenges;

    constructor(
        MiniMeTokenInterface _token,
        TrustNetworkInterface _trustNet,
        bytes32 _topic
    ) 
        public 
    {
        token = _token;
        proposalManager = new ProposalManager(_token, _trustNet);
        topic = _topic;

        votingPeriod = 100;
        applicationExpiryPeriod = 100;
    }

    event ProposalSubmitted(uint indexed proposalId);

    function submitProposal(
        bytes _data,
        uint256 _depositAmount
    )
        external
        returns (uint256 proposalId) 
    {
        uint256 submitPrice = getSubmitPrice(msg.sender);

        require(token.allowance(msg.sender, address(this)) >= submitPrice);
        require(token.transferFrom(msg.sender, address(this), _depositAmount));

        proposalId = nonce++;

        proposals[proposalId] = Proposal(
            false,
            msg.sender,
            _depositAmount,
            0,
            _data,
            block.number + applicationExpiryPeriod);

        emit ProposalSubmitted(proposalId);
    }

    function increaseBalance(uint256 _proposalId, uint _amount) external {
        Proposal storage p = proposals[_proposalId];
        require(p.owner == msg.sender);
        require(token.transferFrom(msg.sender, this, _amount));
        p.balance += _amount;
    }

    function reduceBalance(uint256 _proposalId, uint _amount) external {
        Proposal storage p = proposals[_proposalId];
        require(p.owner == msg.sender);
        require(_amount <= p.balance);
        uint256 submitPrice = getSubmitPrice(msg.sender);
        p.balance -= _amount;
        require(p.balance >= submitPrice);
        require(token.transfer(msg.sender, _amount));
    }

    function withdrawProposal(uint256 _proposalId) 
        external 
    {
        require(proposals[_proposalId].whitelisted == true);
        require(proposals[_proposalId].challengeID == 0 || challenges[proposals[_proposalId].challengeID].resolved);

        uint256 refundValue = proposals[_proposalId].balance;
        address refundAddress = proposals[_proposalId].owner;
        delete proposals[_proposalId];
        if (refundValue > 0) {
            require(token.transfer(refundAddress, refundValue));
        }
    }

    event ProposalDelisted(uint256 indexed proposalId);
    event ProposalChallenged(uint256 indexed proposalId);

    function challenge(uint256 _proposalId) external returns (uint challengeID) {
        Proposal storage p = proposals[_proposalId];

        require(proposalExists(_proposalId));
        
        uint256 submitPrice = getSubmitPrice(msg.sender);

        if(p.balance < submitPrice){
            resetListing(_proposalId);
            emit ProposalDelisted(_proposalId);
            return 0;
        }

        require(p.owner != msg.sender);
        require(token.allowance(msg.sender, address(this)) >= submitPrice);
        require(token.transferFrom(msg.sender, address(this), submitPrice));

        // Prevent multiple challenges
        require(p.challengeID == 0 || challenges[p.challengeID].resolved);

        challengeID = proposalManager.addProposal(topic,keccak256(abi.encodePacked(0, 0, 0x00)), 0, votingPeriod);

        challenges[challengeID] = Challenge({
            challenger: msg.sender,
            rewardPool: ((100 - 50) * submitPrice) / 100,   // TODO: 50% goes to whoever submits the challenge
            stake: submitPrice,
            totalTokens: 0,
            resolved: false
        });

        p.challengeID = challengeID;
        p.balance -= submitPrice;

        emit ProposalChallenged(_proposalId);
    }

    function processProposal(uint256 _proposalId) public {
        if (canBeWhitelisted(_proposalId)) {
          whitelistApplication(_proposalId);
        } else if (challengeCanBeResolved(_proposalId)) {
          resolveChallenge(_proposalId);
        } else {
          revert();
        }
    }

    function canBeWhitelisted(uint256 _proposalId) view public returns (bool) {
        uint challengeID = proposals[_proposalId].challengeID;
        
        if (proposalExists(_proposalId) && 
            proposals[_proposalId].applicationExpiry < block.number && 
            !isWhitelisted(_proposalId) &&
            (challengeID == 0 || challenges[challengeID].resolved == true)
        ) { return true; }

        return false;
    }

    function isWhitelisted(uint256 _proposalId) view public returns (bool whitelisted) {
        return proposals[_proposalId].whitelisted;
    }

    event ProposalWhitelisted(uint256 proposalId);

    function whitelistApplication(uint256 _proposalId) private {
        proposals[_proposalId].whitelisted = true;
        emit ProposalWhitelisted(_proposalId);
    }

    function challengeCanBeResolved(uint256 _proposalId) view public returns (bool) {
        uint challengeID = proposals[_proposalId].challengeID;
        require(challengeID > 0 && !challenges[challengeID].resolved);
        return proposalManager.isVotingAvailable(challengeID) == false;
    }

    function resolveChallenge(uint256 _proposalId) private {
        uint challengeID = proposals[_proposalId].challengeID;
        challenges[challengeID].resolved = true;

        uint reward = determineReward(challengeID);

/*
            !proposalManager.isVotingAvailable(_proposalId) &&
            !proposalManager.hasVotesRecorded(_proposalId) &&
            proposalManager.getProposalFinalResult(_proposalId) == RESULT_NULL &&*/



        uint8 votingResult = proposalManager.getProposalFinalResult(_proposalId);
        
        challenges[challengeID].totalTokens =
            proposalManager.getProposalResultsByVote(_proposalId, votingResult);

        if (votingResult == RESULT_APPROVE) { // TODO:
            whitelistApplication(_proposalId);
            proposals[_proposalId].balance += reward;
        } else {
            resetListing(_proposalId);
            require(token.transfer(challenges[challengeID].challenger, reward));
        }
    }

    function resetListing(uint256 _proposalId) private {
        Proposal storage p = proposals[_proposalId];
        address owner = p.owner;
        uint balance = p.balance;
        delete proposals[_proposalId];
        if (balance > 0){
            require(token.transfer(owner, balance));
        }
    }

    function determineReward(uint _challengeID) public view returns (uint) {
        require(_challengeID > 0 && challenges[_challengeID].resolved);
        require(proposalManager.isVotingAvailable(_challengeID) == false);
        return 1; // TODO:

// Determine reward must check the staked amount the proposal has

    }

    // TODO: function claimReward(uint _challengeID) public

    event SubmitPriceUpdated(address who, uint256 stakeValue);

    function setSubmitPrice(address _who, bool _allowedSubmitter, uint256 _stakeValue) 
        external
        onlyController
    {
        if (_allowedSubmitter || _who == address(0)) {
            submitAllowances[_who] = SubmitPrice(_allowedSubmitter, _stakeValue);
            emit SubmitPriceUpdated(_who, _stakeValue);
        } else {
            delete submitAllowances[_who];   
        }
    }

    function getSubmitPrice(address _who)
        public 
        view 
        returns (uint256 price)
    {
        SubmitPrice memory allowance = submitAllowances[_who];
        if(allowance.allowedSubmitter){
            return allowance.stakePrice;
        } else {
            allowance = submitAllowances[address(0)];
            return allowance.stakePrice;
        }
    }

    function updatePeriods(uint _applicationExpiryPeriod, uint _votingPeriod)
        public
        onlyController {
        votingPeriod = _votingPeriod;
        applicationExpiryPeriod = _applicationExpiryPeriod;
    }

    function proposalExists(uint256 _proposalId) view public returns (bool exists) {
        return proposals[_proposalId].applicationExpiry > 0;
    }
}
