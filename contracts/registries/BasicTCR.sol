pragma solidity ^0.4.23;

import "../common/Controlled.sol";
import "../token/MiniMeTokenInterface.sol";
import "../democracy/ProposalManager.sol";


/**
 @title Token Curated Registry
 @author Richard Ramos (Status Research & Development GmbH) 
 @dev TCR proposal using ideas from ProposalCuration and https://github.com/skmgoldin/tcr
        This contract allows the management of a list of items using a voting
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

    TrustNetworkInterface public trustNet;

    struct SubmitPrice {
        bool priceSet;
        uint256 stakePrice;
    }

    struct Item {
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

    mapping(uint256 => Item) public items; 

    mapping(uint => Challenge) public challenges;

    // Submission prices by address
    mapping (address => SubmitPrice) submitAllowances;

    // Number of blocks where voting a challenged item is allowed
    uint public commitPeriodLength;

    // Number of blocks until a unchalleged item can be whitelisted
    uint public applyStageLength;
    
    // Percentage of the stake a item owner or challenger earns depending on challenge outcome
    uint public rewardPercentage;

    event ItemSubmitted(uint indexed itemId);
    
    event ItemDelisted(uint256 indexed itemId);
    
    event ItemChallenged(uint256 indexed itemId, uint256 indexed challengeId);
    
    event ItemWhitelisted(uint256 indexed itemId);
    
    event SubmitPriceUpdated(address indexed who, uint256 stakeValue);
    
    event ChallengeSucceeded(uint256 indexed itemId, uint indexed challengeId, uint rewardPool, uint totalTokens);
    
    event ChallengeFailed(uint256 indexed itemId, uint indexed challengeId, uint rewardPool, uint totalTokens);

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
        trustNet = _trustNet;
        proposalManager = new ProposalManager(_token, _trustNet);

        // Default values
        proposalManager.setQuorum(60);
        commitPeriodLength = 8640;
        applyStageLength = 8640;
        rewardPercentage = 50;
    }

    /**
     @notice Submit an item to registry
     @param _data Data that represents an item (ie. IPFS Hash, etc)
     @param _depositAmount Amount of tokens used as balance for challenges 
                             and publishing price. Must be greater or equal 
                             to submission price
    @return Item Id
     **/
    function submitItem(
        bytes _data,
        uint256 _depositAmount
    )
        external
        returns (uint256 itemId) 
    {
        uint256 submitPrice = getSubmitPrice(msg.sender);

        require(token.allowance(msg.sender, address(this)) >= submitPrice);
        require(token.transferFrom(msg.sender, address(this), _depositAmount));

        itemId = nonce++;

        items[itemId] = Item({
            whitelisted: false,
            owner: msg.sender,
            balance: _depositAmount,
            challengeId: 0,
            data: _data,
            applicationExpiry: block.number + applyStageLength});

        emit ItemSubmitted(itemId);
    }

    /**
     @notice Increase item balance
     @param _itemId Id of the item to increase balance
     @param _amount Amount of tokens to add to balance
     **/
    function increaseBalance(
        uint256 _itemId,
        uint _amount
    ) 
        external
    {
        Item storage p = items[_itemId];
        require(p.owner == msg.sender);
        require(token.transferFrom(msg.sender, this, _amount));
        p.balance += _amount;
    }

    /**
     @notice Reduce item balance. Must be grater than submitPrice
     @param _itemId Id of the item to increase balance
     @param _amount Amount of tokens to add to balance
     **/
    function reduceBalance(
        uint256 _itemId,
        uint _amount
    )
        external
    {
        Item storage p = items[_itemId];
        require(p.owner == msg.sender);
        require(_amount <= p.balance);
        uint256 submitPrice = getSubmitPrice(msg.sender);
        p.balance -= _amount;
        require(p.balance >= submitPrice);
        require(token.transfer(msg.sender, _amount));
    }

    /**
     @notice Withdraw item from TCR.
     @dev To withdraw an item, it must be whitelisted and unchallenged.
          It will refund the balance to the item owner
     @param _itemId Id of the item to increase balance
     **/
    function withdrawItem(uint256 _itemId) 
        external 
    {
        require(items[_itemId].whitelisted == true);
        require(items[_itemId].challengeId == 0 || challenges[items[_itemId].challengeId].resolved);

        removeItem(_itemId);
    }
    
    /**
     @notice Challenge an existing unchallenged item
     @dev This will also remove an item that doesn't have enough balance to cover the submission price
     @param _itemId Id
     @return challenge Id
     */
    function challenge(uint256 _itemId) 
        external 
        returns (uint challengeId) 
    {
        require(itemExists(_itemId));
        
        Item storage p = items[_itemId];

        uint256 submitPrice = getSubmitPrice(msg.sender);

        // Touch and go
        if(p.balance < submitPrice){
            removeItem(_itemId);
            emit ItemDelisted(_itemId);
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

        emit ItemChallenged(_itemId, challengeId);
    }

    /**
     @notice Process any item change or revert if there are no changes pending
     @dev Will whitelist an item or resolve a pending challenge
     @param _itemId Id of the item
     */
    function processItem(uint256 _itemId)
        public
    {
        if (canBeWhitelisted(_itemId)) {
            whitelistItem(_itemId);
        } else if (challengeCanBeResolved(_itemId)) {
            resolveChallenge(_itemId);
        } else {
            revert();
        }
    }

    /**
     @notice Determine if an item can be whitelisted
     @dev Call this function before invoking updateItem to save gas
     @param _itemId Id of the item to verify
     @return Boolean that indicates if an item can be whitelisted or not
     */
    function canBeWhitelisted(uint256 _itemId)
        public
        view
        returns (bool)
    {
        uint challengeId = items[_itemId].challengeId;
        
        if (itemExists(_itemId) &&
            items[_itemId].applicationExpiry < block.number && 
            !isWhitelisted(_itemId) &&
            (!proposalManager.exists(challengeId) || challenges[challengeId].resolved)
        ) {
            return true;
        }

        return false;
    }

    /**
     @notice Determine if an item is whitelisted or not
     @dev An item is whitelisted if it reaches the apply length unchallenged or if it survives a challenge
     @param _itemId Id of the item
     @return Boolean to indicate if it is whitelisted
    */
    function isWhitelisted(uint256 _itemId)
        public
        view
        returns (bool whitelisted)
    {
        return items[_itemId].whitelisted;
    }
    
    /**
     @dev Whitelist an item
     @param _itemId Id of the item to whitelist
     */
    function whitelistItem(uint256 _itemId)
        private 
    {
        items[_itemId].whitelisted = true;
        emit ItemWhitelisted(_itemId);
    }

    /**
     @notice Determine if an item challenge can be resolved.
     @dev Call this function before invoking updateItem to save gas
     @dev Will revert if item is unchallenged
     @param _itemId Id of the item to verify
     @return Boolean that indicates if an item challenge can be solved or not
     */
    function challengeCanBeResolved(uint256 _itemId)
        public
        view
        returns (bool)
    {
        uint challengeId = items[_itemId].challengeId;
        require(proposalManager.exists(challengeId) && !challenges[challengeId].resolved);
        return proposalManager.isVotingAvailable(challengeId) == false;
    }

    /**
     @dev Resolve an item challenge after voting is complete. 
          Also calculate rewards and transfer tokens
     @param _itemId Id of the challenged item
     */
    function resolveChallenge(uint256 _itemId) 
        private 
    {
        uint challengeId = items[_itemId].challengeId;

        Challenge storage c = challenges[challengeId];
        
        uint reward = determineReward(challengeId);
        uint8 votingResult = proposalManager.getProposalFinalResult(challengeId);
        
        c.resolved = true;
        c.winningTokens = proposalManager.getProposalResultsByVote(challengeId, votingResult);

        if (votingResult == RESULT_APPROVE || c.winningTokens == 0) {
            whitelistItem(_itemId);
            items[_itemId].balance += reward;
            emit ChallengeFailed(_itemId, challengeId, c.rewardPool, c.winningTokens);
        } else {
            removeItem(_itemId);
            emit ChallengeSucceeded(_itemId, challengeId, c.rewardPool, c.winningTokens);
            require(token.transfer(c.challenger, reward));
        }
    }

    /**
     @dev Remove an item from listing and refund balance to owner
     @param _itemId Item to be removed
     */
    function removeItem(uint256 _itemId)
        private
    {
        Item storage p = items[_itemId];
        address owner = p.owner;
        uint balance = p.balance;
        delete items[_itemId];
        if (balance > 0){
            require(token.transfer(owner, balance));
        }
    }

    /**
     @notice Determine reward earned by the item owner or challenger after voting ends
     @dev Requires voting process to conclude
     @param _challengeId Id of the challenge to verify rewards
     @return Reward amount 
     */
    function determineReward(uint _challengeId) 
        public
        view
        returns (uint)
    {
        require(proposalManager.exists(_challengeId) && !challenges[_challengeId].resolved);
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
     @notice Get submission price to submit item or challenge
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
     * @notice Determine if an item exists
     * @param _itemId Id of the item to look for
     * @return Boolean that indicates if an item exists or not
     */
    function itemExists(uint256 _itemId) 
        view
        public
        returns (bool exists) 
    {
        return items[_itemId].applicationExpiry > 0;
    }

    /**
     @notice Determine if an item is valid
     @param _itemId Id of the item to look for
     @return Boolean that indicates if an item is valid or not
     **/
     function isValid(uint256 _itemId)
        view
        public
        returns (bool)
    {
        return itemExists(_itemId) &&
                isWhitelisted(_itemId) &&
                (
                    items[_itemId].challengeId == 0 ||
                    challenges[items[_itemId].challengeId].resolved
                );
    }
    
    // TCR Parameter Management
    
    /**
     @notice Set item submission price for everyone, specific addresses
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
     @param _applyStageLength Number of blocks before an item can be whitelisted
     @param _commitPeriodLength Number of blocks where voting is allowed in a challenged item
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
     @notice Set porcentage of the reward that goes to the owner or challenger of an item
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
