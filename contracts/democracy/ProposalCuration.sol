pragma solidity ^0.4.21;

import "../common/Controlled.sol";
import "../token/MiniMeTokenInterface.sol";
import "./ProposalManager.sol";

contract ProposalCuration is Controlled {

    uint256 public constant RESULT_NULL = 0;
    uint256 public constant RESULT_REJECT = 1;
    uint256 public constant RESULT_APPROVE = 2;
    uint256 public constant RESULT_VETO = 3;

    mapping (uint256 => ProposalData) public proposals; 
    ProposalManager public proposalManager;
    
    uint256 public approvalTimeLimit;
    MiniMeTokenInterface token;

    mapping (address => SubmitPrice) submitAllowances;

    struct SubmitPrice {
        bool allowedSubmitter;
        uint256 stakePrice;
    }

    struct ProposalData {
        address proposer;
        address to;
        uint256 value;
        bytes data;
        bytes description;
        uint256 stakedAmount;
    }

    constructor(
        MiniMeTokenInterface _token,
        TrustNetworkInterface _trustNet
    ) 
        public 
    {
        token = _token;
        proposalManager = new ProposalManager(_token, _trustNet);
    }

    function submitProposal(
        bytes32 _topic,
        address _to,
        uint256 _value,
        bytes _data,
        bytes _description
    )
        external
        returns (uint256 proposalId) 
    {
        uint256 submitPrice = getSubmitPrice(msg.sender);
        require(token.allowance(msg.sender, address(this)) >= submitPrice);
        require(token.transferFrom(msg.sender, address(this), submitPrice));
        proposalId = proposalManager.addProposal(_topic,keccak256(_to,_value,_data), 0, 1000);
        proposals[proposalId] = ProposalData(
            msg.sender,
            _to,
            _value,
            _data,
            _description,
            submitPrice
        );

    }
    
    function withdrawStake(
        uint256 _proposalId
    ) 
        external 
    {
        require(proposalManager.getProposalFinalResult(_proposalId) == RESULT_APPROVE);
        uint256 refundValue = proposals[_proposalId].stakedAmount;
        address refundAddress = proposals[_proposalId].proposer;
        delete proposals[_proposalId];
        if (refundValue > 0) {
            require(token.transfer(refundAddress, refundValue));
        }
    }

    function slashStake(
        uint256 _proposalId
    )
        external 
    {
        uint8 result = proposalManager.getProposalFinalResult(_proposalId);
        require(result == RESULT_REJECT || result == RESULT_VETO);
        uint256 refundValue = proposals[_proposalId].stakedAmount;
        delete proposals[_proposalId];
        if (refundValue > 0) {
            require(token.transfer(controller, refundValue));
        }
        
    }
    
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
            allowance = submitAllowances[_who];
            require(allowance.allowedSubmitter);
            return allowance.stakePrice;
        }
    }
}