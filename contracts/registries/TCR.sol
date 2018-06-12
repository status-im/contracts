pragma solidity ^0.4.24;

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

    struct SubmitPrice {
        bool allowedSubmitter;
        uint256 stakePrice;
    }

    struct Proposal {
        uint256 applicationExpiry;
        bool whitelisted;
        address owner;
        uint256 unstakedAmount;
        bytes data;
        uint256 challengeID;
    }

    struct Challenge {
        bool resolved; 
        uint256 rewardPool;
        address challenger;
        uint256 stake;
        uint256 totalTokens;
        mapping(address => bool) tokenClaims;
    }

    mapping (uint256 => Proposal) public proposals; 
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
    }

    function submitProposal(
        bytes32 _listingHash,
        bytes _data,
        uint _amountToStake
    )
        external
        returns (uint256 proposalId) 
    {
        uint256 submitPrice = getSubmitPrice(msg.sender);
        require(token.allowance(msg.sender, address(this)) >= submitPrice);
        require(token.transferFrom(msg.sender, address(this), _amountToStake));

        proposalId = proposalManager.addProposal(topic,keccak256(abi.encodePacked(0,0,0x00)));
                
        proposals[proposalId] = Proposal(
            1000, // TODO: Determine if we're going to use proposal manager expiration time
            false,
            msg.sender,
            _amountToStake,
            _data,
            0);
    }

    function increaseStake(uint256 _proposalId, uint _amount) external {
        Proposal storage p = proposals[_proposalId];
        require(p.owner == msg.sender);
        require(token.transferFrom(msg.sender, this, _amount));
        p.unstakedAmount += _amount;
    }

    function reduceStake(uint256 _proposalId, uint _amount) external {
        Proposal storage p = proposals[_proposalId];
        require(p.owner == msg.sender);
        require(_amount <= p.unstakedAmount);
        uint256 submitPrice = getSubmitPrice(msg.sender);
        p.unstakedAmount -= _amount;
        require(p.unstakedAmount >= submitPrice);
        require(token.transfer(msg.sender, _amount));
    }

    function withdrawStake(uint256 _proposalId) 
        external 
    {
        require(proposalManager.getProposalFinalResult(_proposalId) == RESULT_APPROVE);
        require(proposals[_proposalId].challengeID == 0 || challenges[proposals[_proposalId].challengeID].resolved);

        uint256 refundValue = proposals[_proposalId].unstakedAmount;
        address refundAddress = proposals[_proposalId].owner;
        delete proposals[_proposalId];
        if (refundValue > 0) {
            require(token.transfer(refundAddress, refundValue));
        }
    }

    function challenge(uint256 _proposalId) external returns (uint challengeID) {
        Proposal storage p = proposals[_proposalId];

        require(p.whitelisted == true && proposalManager.getProposalFinalResult(_proposalId) == RESULT_APPROVE);
        
        uint256 submitPrice = getSubmitPrice(msg.sender);
        require(token.allowance(msg.sender, address(this)) >= submitPrice);
        require(token.transferFrom(msg.sender, address(this), submitPrice));

        // Prevent multiple challenges
        require(p.challengeID == 0 || challenges[p.challengeID].resolved);

        challengeID = proposalManager.addProposal(topic,keccak256(abi.encodePacked(0, 0, 0x00)));

        challenges[challengeID] = Challenge({
            challenger: msg.sender,
            rewardPool: ((100 - 50) * submitPrice) / 100,   // TODO: 50% goes to whoever submits the challenge
            stake: submitPrice,
            totalTokens: 0,
            resolved: false
        });

        p.challengeID = challengeID;
        p.unstakedAmount -= submitPrice;
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

        if (
            proposals[_proposalId].applicationExpiry < now &&
            !isWhitelisted(_proposalId) &&
            (challengeID == 0 || challenges[challengeID].resolved == true)
        ) { return true; }

        return false;
    }

    function isWhitelisted(uint256 _proposalId) view public returns (bool whitelisted) {
        return proposals[_proposalId].whitelisted;
    }

    function whitelistApplication(uint256 _proposalId) private {
        proposals[_proposalId].whitelisted = true;
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


        uint8 votingResult = proposalManager.getProposalFinalResult(_proposalId);
        
        challenges[challengeID].totalTokens =
            proposalManager.getProposalResultsByVote(_proposalId, votingResult);

        if (votingResult == RESULT_APPROVE) { // TODO:
            whitelistApplication(_proposalId);
            proposals[_proposalId].unstakedAmount += reward;
        } else {
            resetListing(_proposalId);
            require(token.transfer(challenges[challengeID].challenger, reward));
        }
    }

    function resetListing(uint256 _proposalId) private {
        Proposal storage p = proposals[_proposalId];
        address owner = p.owner;
        uint unstakedAmount = p.unstakedAmount;
        delete proposals[_proposalId];
        if (unstakedAmount > 0){
            require(token.transfer(owner, unstakedAmount));
        }
    }

    function determineReward(uint _challengeID) public view returns (uint) {
        require(_challengeID > 0 && challenges[_challengeID].resolved);
        require(proposalManager.isVotingAvailable(_challengeID) == false);
        return 1; // TODO:
    }

    // TODO: function claimReward(uint _challengeID) public

    function setSubmitPrice(address _who, bool _allowedSubmitter, uint256 _stakeValue) 
        external
        onlyController
    {
        if (_allowedSubmitter) {
            submitAllowances[_who] = SubmitPrice(_allowedSubmitter, _stakeValue);
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
}
