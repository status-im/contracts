pragma solidity ^0.4.23;

import "../common/Controlled.sol";
import "../token/MiniMeTokenInterface.sol";
import "../democracy/ProposalManager.sol";


/**
 @title Token Curated Registry
 @author Richard Ramos (Status Research & Development GmbH) 
 @dev TCR proposal using ideas from ProposalCuration and https://github.com/skmgoldin/tcr
        This contract allows the management of a list of Proposals using a voting
        mechanism in order to publish and remove them. This uses Status' democracy contracts 
        and doesn't require a registry for managing parameters, set price to specific addresses
 **/
contract BasicTCR is Controlled {

    uint256 public constant RESULT_NULL = 0;

    uint256 public constant RESULT_REJECT = 1;

    uint256 public constant RESULT_APPROVE = 2;

    uint256 public constant RESULT_VETO = 3;

    ProposalManager public proposalManager;

    MiniMeTokenInterface public token;

    struct SubmitPrice {
        bool priceSet;
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

    // Submission prices by address
    mapping (address => SubmitPrice) submitAllowances;

    // Number of blocks where voting a challenged proposal is allowed
    uint public commitPeriodLength;

    // Number of blocks until a unchalleged proposal can be whitelisted
    uint public applyStageLength;
    
    // Percentage of the stake a proposal owner or challenger earns depending on challenge outcome
    uint public rewardPercentage;

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
     **/
    constructor(
        MiniMeTokenInterface _token,
        TrustNetworkInterface _trustNet
    ) 
        public
    {
        token = _token;
        proposalManager = new ProposalManager(_token, _trustNet);

        // Default values
        proposalManager.setQuorum(60);
        commitPeriodLength = 8640;
        applyStageLength = 8640;
        rewardPercentage = 50;
    }

    /**
     @notice Submit a proposal to registry
     @param _data Data that represents a proposal (ie. IPFS Hash, etc)
     @param _depositAmount Amount of tokens used as balance for challenges 
                             and publishing price. Must be greater or equal 
                             to submission price
    @return Proposal Id
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

        proposals[proposalId] = Proposal({
            whitelisted: false,
            owner: msg.sender,
            balance: _depositAmount,
            challengeId: 0,
            data: _data,
            applicationExpiry: block.number + applyStageLength});

        emit ProposalSubmitted(proposalId);
    }

    /**
     @notice Increase proposal balance
     @param _proposalId Id of the proposal to increase balance
     @param _amount Amount of tokens to add to balance
     **/
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

    /**
     @notice Reduce proposal balance. Must be grater than submitPrice
     @param _proposalId Id of the proposal to increase balance
     @param _amount Amount of tokens to add to balance
     **/
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

    /**
     @notice Withdraw proposal from TCR.
     @dev To withdraw a proposal, it must be whitelisted and unchallenged.
          It will refund the balance to the proposal owner
     @param _proposalId Id of the proposal to increase balance
     **/
    function withdrawProposal(uint256 _proposalId) 
        external 
    {
        require(proposals[_proposalId].whitelisted == true);
        require(proposals[_proposalId].challengeId == 0 || challenges[proposals[_proposalId].challengeId].resolved);

        removeProposal(_proposalId);
    }
    
    /**
     @notice Challenge an existing unchallenged proposal
     @dev This will also remove a proposal that doesn't have enough balance to cover the submission price
     @param _proposalId Id
     @return challenge Id
     */
    function challenge(uint256 _proposalId) 
        external 
        returns (uint challengeId) 
    {
        require(proposalExists(_proposalId));
        
        Proposal storage p = proposals[_proposalId];

        uint256 submitPrice = getSubmitPrice(msg.sender);

        // Touch and go
        if(p.balance < submitPrice){
            removeProposal(_proposalId);
            emit ProposalDelisted(_proposalId);
            return 0;
        }

        require(p.owner != msg.sender);
        require(token.allowance(msg.sender, address(this)) >= submitPrice);
        require(token.transferFrom(msg.sender, address(this), submitPrice));

        // Prevent multiple challenges
        require(p.challengeId == 0 || challenges[p.challengeId].resolved);

        challengeId = proposalManager.addProposal(0x00, keccak256(abi.encodePacked(address(0), uint256(0), 0x00)), 0, commitPeriodLength);

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

    /**
     @notice Process any proposal change or revert if there are no changes pending
     @dev Will whitelist a proposal or resolve a pending challenge
     @param _proposalId Id of the proposal
     */
    function processProposal(uint256 _proposalId)
        public
    {
        if (canBeWhitelisted(_proposalId)) {
            whitelistProposal(_proposalId);
        } else if (challengeCanBeResolved(_proposalId)) {
            resolveChallenge(_proposalId);
        } else {
            revert();
        }
    }

    /**
     @notice Determine if a proposal can be whitelisted
     @dev Call this function before invoking updateProposal to save gas
     @param _proposalId Id of the proposal to verify
     @return Boolean that indicates if a proposal can be whitelisted or not
     */
    function canBeWhitelisted(uint256 _proposalId)
        public
        view
        returns (bool)
    {
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

    /**
     @notice Determine if a proposal is whitelisted or not
     @dev A proposal is whitelisted if it reaches the apply length unchallenged or if it survives a challenge
     @param _proposalId Id of the proposal
     @return Boolean to indicate if it is whitelisted
    */
    function isWhitelisted(uint256 _proposalId)
        public
        view
        returns (bool whitelisted)
    {
        return proposals[_proposalId].whitelisted;
    }
    
    /**
     @dev Whitelist a proposal
     @param _proposalId Id of the proposal to whitelist
     */
    function whitelistProposal(uint256 _proposalId)
        private 
    {
        proposals[_proposalId].whitelisted = true;
        emit ProposalWhitelisted(_proposalId);
    }

    /**
     @notice Determine if a proposal challenge can be resolved.
     @dev Call this function before invoking updateProposal to save gas
     @dev Will revert if proposal is unchallenged
     @param _proposalId Id of the proposal to verify
     @return Boolean that indicates if a proposal challenge can be solved or not
     */
    function challengeCanBeResolved(uint256 _proposalId)
        public
        view
        returns (bool)
    {
        uint challengeId = proposals[_proposalId].challengeId;
        require(challengeId > 0 && !challenges[challengeId].resolved);
        return proposalManager.isVotingAvailable(challengeId) == false;
    }

    /**
     @dev Resolve a proposal challenge after voting is complete. 
          Also calculate rewards and transfer tokens
     @param _proposalId Id of the challenged proposal
     */
    function resolveChallenge(uint256 _proposalId) 
        private 
    {
        uint challengeId = proposals[_proposalId].challengeId;

        Challenge storage c = challenges[challengeId];
        
        uint reward = determineReward(challengeId);
        uint8 votingResult = proposalManager.getProposalFinalResult(challengeId);
        
        c.resolved = true;
        c.winningTokens = proposalManager.getProposalResultsByVote(challengeId, votingResult);

        if (votingResult == RESULT_APPROVE || c.winningTokens == 0) {
            whitelistProposal(_proposalId);
            proposals[_proposalId].balance += reward;
            emit ChallengeFailed(_proposalId, challengeId, c.rewardPool, c.winningTokens);
        } else {
            removeProposal(_proposalId);
            emit ChallengeSucceeded(_proposalId, challengeId, c.rewardPool, c.winningTokens);
            require(token.transfer(c.challenger, reward));
        }
    }

    /**
     @dev Remove a proposal from listing and refund balance to owner
     @param _proposalId Proposal to be removed
     */
    function removeProposal(uint256 _proposalId)
        private
    {
        Proposal storage p = proposals[_proposalId];
        address owner = p.owner;
        uint balance = p.balance;
        delete proposals[_proposalId];
        if (balance > 0){
            require(token.transfer(owner, balance));
        }
    }

    /**
     @notice Determine reward earned by the proposal owner or challenger after voting ends
     @dev Requires voting process to conclude
     @param _challengeId Id of the challenge to verify rewards
     @return Reward amount 
     */
    function determineReward(uint _challengeId) 
        public
        view
        returns (uint)
    {
        require(_challengeId > 0 && !challenges[_challengeId].resolved);
        require(proposalManager.isVotingAvailable(_challengeId) == false);

        // Edge case, nobody voted, give all tokens to the challenger.
        uint8 votingResult = proposalManager.getProposalFinalResult(_challengeId);
        if (proposalManager.getProposalResultsByVote(_challengeId, votingResult) == 0) {
            return 2 * challenges[_challengeId].stake;
        }

        return (2 * challenges[_challengeId].stake) - challenges[_challengeId].rewardPool;
    }

    /**
     @notice Claim reward from a challenge after it ends. Will transfer token proportion
     @dev Only invoke this function if you voted for a challenge and the option selected was the final result
     @param _challengeId Id of the challenge
     */
    function claimReward(uint _challengeId) 
        public 
    {
        require(challenges[_challengeId].tokenClaims[msg.sender] == false);
        require(challenges[_challengeId].resolved == true);

        uint reward;
        uint voterTokens;

        (reward, voterTokens) = getVoterReward(_challengeId);

        challenges[_challengeId].winningTokens -= voterTokens;
        challenges[_challengeId].rewardPool -= reward;
        challenges[_challengeId].tokenClaims[msg.sender] = true;
        
        require(token.transfer(msg.sender, reward));
    }

    /**
     @notice Get voter reward and votes for a specific challenge
     @param _challengeId Id of the challenge
     @return Reward amount and number of votes
     */
    function getVoterReward(uint _challengeId)
        public
        view
        returns (uint reward, uint votes) 
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
    
    /**
     @notice Get submission price to submit proposal or challenge
     @param _who Get price for address (normally msg.sender)
     @return price of the submission
     */
    function getSubmitPrice(address _who)
        public 
        view 
        returns (uint256 price)
    {
        SubmitPrice memory allowance = submitAllowances[_who];
        if(allowance.priceSet){
            return allowance.stakePrice;
        } else {
            allowance = submitAllowances[address(0)];
            return allowance.stakePrice;
        }
    }
    
    /**
     * @notice Determine if a proposal exists
     * @param _proposalId Id of the proposal to look for
     * @return Boolean that indicates if a proposal exists or not
     */
    function proposalExists(uint256 _proposalId) 
        view
        public
        returns (bool exists) 
    {
        return proposals[_proposalId].applicationExpiry > 0;
    }
    
    // TCR Parameter Management
    
    /**
     @notice Set proposal submission price for everyone, specific addresses
             or delete submission price if update is false
     @param _who Address to set price, use address(0) for everyone
     @param _remove Remove the price info for an address 
     **/
    function setSubmitPrice(
        address _who,
        bool _remove,
        uint256 _stakeValue
    ) 
        external
        onlyController
    {
        if(_remove){
            require(_who != address(0));
            delete submitAllowances[_who];   
        } else {
            submitAllowances[_who] = SubmitPrice(true, _stakeValue);
            emit SubmitPriceUpdated(_who, _stakeValue);
        }
    }
    
    /**
     @notice Update whitelisting and voting period in block numbers
     @param _applyStageLength Number of blocks before a proposal can be whitelisted
     @param _commitPeriodLength Number of blocks where voting is allowed in a challenged proposal
     **/
    function updatePeriods(
        uint _applyStageLength,
        uint _commitPeriodLength
    )
        external
        onlyController
    {
        commitPeriodLength = _commitPeriodLength;
        applyStageLength = _applyStageLength;
    }
    
    /**
     @notice Set porcentage of the reward that goes to the owner or challenger of a proposal
     @dev This percentage is used to determine the reward that goes to whoever wins the challenge
          being the rest of the proportion given to the voters
     **/
    function setRewardPercentage(uint _percentage)
        external
        onlyController
    {
        require(_percentage <= 100);
        rewardPercentage = _percentage;
    }

    /**
     @notice Set majority percentage required
     @dev In case simple majority is not desired. The percentage may be changed
     @param _percentage Percentage required: 0 < N <= 100
     **/
    function setRequiredMajority(uint _percentage)
        external
        onlyController
    {
        proposalManager.setQuorum(_percentage);
    }
}
