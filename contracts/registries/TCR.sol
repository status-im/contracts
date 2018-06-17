pragma solidity ^0.4.23;

import "../common/Controlled.sol";
import "../token/MiniMeTokenInterface.sol";
import "../democracy/ProposalManager.sol";

/**
 @title Token Curated Registry
 @author Richard Ramos (Status Research & Development GmbH) 
 @dev TCR proposal using ideas from ProposalCuration and https://github.com/skmgoldin/tcr
        This contract allows the management of a list of Proposals using a voting
        mechanism in order to publish and remove them. Main difference between this and
        tcr is that this uses Status' democracy contracts and doesn't require a registry
        for managing parameters, price can be set to specific addresses, and some events
        where removed.
 **/
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

    // Number of blocks where voting a challenged proposal is allowed
    uint public votingPeriod;
    
    // Number of blocks until a unchalleged proposal can be whitelisted
    uint public applicationExpiryPeriod;
    
    // Percentage of the stake a proposal owner or challenger earns depending on challenge outcome
    uint public rewardPercentage;

    struct SubmitPrice {
        bool allowedSubmitter;
        uint256 stakePrice;
    }

    struct Proposal {
        bool whitelisted;
        address owner;
        uint256 balance;
        uint256 challengeId;
        bytes data;
        uint256 applicationExpiry;
    }

    struct Challenge {
        bool resolved; 
        uint256 rewardPool;
        address challenger;
        uint256 stake;
        uint256 winningTokens;
        mapping(address => bool) tokenClaims;
    }

    uint256 nonce;
    mapping(uint256 => Proposal) public proposals; 
    mapping(uint => Challenge) public challenges;

    event ProposalSubmitted(uint indexed proposalId);
    event ProposalDelisted(uint256 indexed proposalId);
    event ProposalChallenged(uint256 indexed proposalId, uint256 indexed challengeId);
    event ProposalWhitelisted(uint256 indexed proposalId);
    event SubmitPriceUpdated(address indexed who, uint256 stakeValue);
    event ChallengeSucceeded(uint256 indexed proposalId, uint indexed challengeId, uint rewardPool, uint totalTokens);
    event ChallengeFailed(uint256 indexed proposalId, uint indexed challengeId, uint rewardPool, uint totalTokens);

    /**
     @notice Constructor of TCR
     @param _token Address of Status Network Token (or any ERC20 compatible token)
     @param _trustNet Address of a TrustNetworkInterface contract
     @param _topic Topic to be used for the ProposalManager
     **/
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

        // Default values
        votingPeriod = 100;
        applicationExpiryPeriod = 100;
        rewardPercentage = 70;
    }

    /**
     @notice Submit a proposal to registry
     @param _data Data that represents a proposal (ie. IPFS Hash, etc)
     @param _depositAmount amount of tokens used as balance for challenges 
                             and publishing price. Must be greater or equal 
                             to submission price
     **/
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

    function increaseBalance(
        uint256 _proposalId,
        uint _amount
    ) 
        external
    {
        Proposal storage p = proposals[_proposalId];
        require(p.owner == msg.sender);
        require(token.transferFrom(msg.sender, this, _amount));
        p.balance += _amount;
    }

    function reduceBalance(
        uint256 _proposalId,
        uint _amount
    )
        external
    {
        Proposal storage p = proposals[_proposalId];
        require(p.owner == msg.sender);
        require(_amount <= p.balance);
        uint256 submitPrice = getSubmitPrice(msg.sender);
        p.balance -= _amount;
        require(p.balance >= submitPrice);
        require(token.transfer(msg.sender, _amount));
    }

    function withdrawProposal(
        uint256 _proposalId
    ) 
        external 
    {
        require(proposals[_proposalId].whitelisted == true);
        require(proposals[_proposalId].challengeId == 0 || challenges[proposals[_proposalId].challengeId].resolved);

        uint256 refundValue = proposals[_proposalId].balance;
        address refundAddress = proposals[_proposalId].owner;
        delete proposals[_proposalId];
        if (refundValue > 0) {
            require(token.transfer(refundAddress, refundValue));
        }
    }
    
    function challenge(uint256 _proposalId) external returns (uint challengeId) {
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
        require(p.challengeId == 0 || challenges[p.challengeId].resolved);

        challengeId = proposalManager.addProposal(topic, keccak256(abi.encodePacked(address(0), uint256(0), 0x00)), 0, votingPeriod);

        challenges[challengeId] = Challenge({
            challenger: msg.sender,
            rewardPool: ((100 - rewardPercentage) * submitPrice) / 100,
            stake: submitPrice,
            winningTokens: 0,
            resolved: false
        });

        p.challengeId = challengeId;
        p.balance -= submitPrice;

        emit ProposalChallenged(_proposalId, challengeId);
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
        uint challengeId = proposals[_proposalId].challengeId;
        
        if (proposalExists(_proposalId) &&
            proposals[_proposalId].applicationExpiry < block.number && 
            !isWhitelisted(_proposalId) &&
            (challengeId == 0 || challenges[challengeId].resolved == true)
        ) {
            return true;
        }

        return false;
    }

    function isWhitelisted(uint256 _proposalId) view public returns (bool whitelisted) {
        return proposals[_proposalId].whitelisted;
    }
    
    function whitelistApplication(uint256 _proposalId) private {
        proposals[_proposalId].whitelisted = true;
        emit ProposalWhitelisted(_proposalId);
    }

    function challengeCanBeResolved(uint256 _proposalId) view public returns (bool) {
        uint challengeId = proposals[_proposalId].challengeId;
        require(challengeId > 0 && !challenges[challengeId].resolved);
        return proposalManager.isVotingAvailable(challengeId) == false;
    }

    function resolveChallenge(uint256 _proposalId) private {
        uint challengeId = proposals[_proposalId].challengeId;

        Challenge storage challenge = challenges[challengeId];
        
        uint reward = determineReward(challengeId);
        uint8 votingResult = proposalManager.getProposalFinalResult(challengeId);
        
        challenge.resolved = true;
        challenge.winningTokens = proposalManager.getProposalResultsByVote(challengeId, votingResult);

        if (votingResult == RESULT_APPROVE || challenge.winningTokens == 0) {
            whitelistApplication(_proposalId);
            proposals[_proposalId].balance += reward;
            emit ChallengeFailed(_proposalId, challengeId, challenge.rewardPool, challenge.winningTokens);
        } else {
            resetListing(_proposalId);
            emit ChallengeSucceeded(_proposalId, challengeId, challenge.rewardPool, challenge.winningTokens);
            require(token.transfer(challenges[challengeId].challenger, reward));
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

    function determineReward(uint _challengeId) public view returns (uint) {
        require(_challengeId > 0 && !challenges[_challengeId].resolved);
        require(proposalManager.isVotingAvailable(_challengeId) == false);

        // Edge case, nobody voted, give all tokens to the challenger.
        uint8 votingResult = proposalManager.getProposalFinalResult(_challengeId);
        if (proposalManager.getProposalResultsByVote(_challengeId, votingResult) == 0) {
            return 2 * challenges[_challengeId].stake;
        }

        return (2 * challenges[_challengeId].stake) - challenges[_challengeId].rewardPool;
    }

    function claimReward(uint _proposalId) public {
        Proposal p = proposals[_proposalId];
        uint challengeId = p.challengeId;

        require(challenges[challengeId].tokenClaims[msg.sender] == false);
        require(challenges[challengeId].resolved == true);

        uint reward;
        uint voterTokens;

        (reward, voterTokens) = voterReward(challengeId);

        challenges[challengeId].winningTokens -= voterTokens;
        challenges[challengeId].rewardPool -= reward;
        challenges[challengeId].tokenClaims[msg.sender] = true;
        require(token.transfer(msg.sender, reward));
    }

    function voterReward(uint _challengeId)
        public view returns (uint reward, uint votes) 
    {

        uint8 vote;
        uint256 voterTokens;

        uint8 votingResult = proposalManager.getProposalFinalResult(_challengeId);
        (vote, votes) = proposalManager.getVoteInfo(_challengeId, msg.sender);

        uint winningTokens = challenges[_challengeId].winningTokens;
        uint rewardPool = challenges[_challengeId].rewardPool;

        if(vote == votingResult){
            voterTokens = votes;
        } else {
            voterTokens = 0;
        }

        reward = (voterTokens * rewardPool) / winningTokens;
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
    
    function proposalExists(uint256 _proposalId) view public returns (bool exists) {
        return proposals[_proposalId].applicationExpiry > 0;
    }
    
    // CONTRACT MANAGEMENT
    
    function setSubmitPrice(
        address _who,
        bool _allowedSubmitter,
        uint256 _stakeValue
    ) 
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
    
    function updatePeriods(
        uint _applicationExpiryPeriod,
        uint _votingPeriod
    )
        public
        onlyController
    {
        votingPeriod = _votingPeriod;
        applicationExpiryPeriod = _applicationExpiryPeriod;
    }
    
    function setRewardPercentage(
        uint percentage
    )
        external
        onlyController
    {
        require(percentage <= 100);
        rewardPercentage = percentage;
    }
}
