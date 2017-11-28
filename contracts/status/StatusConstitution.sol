pragma solidity ^0.4.17;

import "../deploy/BasicSystemStorage.sol";
import "../token/MiniMeToken.sol";
import "../democracy/TrustNetworkModel.sol";
import "../democracy/ProposalManager.sol";
import "../registry/TokenRegistry.sol";

/**
 * @title StatusConstitution
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @dev 
 */
contract StatusConstitution is BasicSystemStorage {
    
    MiniMeToken public SNT ;
    TrustNetworkModel public trustNet = TrustNetworkModel(0x0);
    ProposalManager proposalManager;
    address public stakeBank;

    function StatusConstitution(address _SNT, address _trustNet, address _stakeBank) public {
        SNT = MiniMeToken(_SNT);
        trustNet = TrustNetworkModel(_trustNet);
        stakeBank = _stakeBank; 
        proposalManager = new ProposalManager(SNT, trustNet, stakeBank);
        TokenRegistry tokenReg = new TokenRegistry();
        trustNet.addTopic(address(tokenReg), 0x0);
    }

    function executeProposal(uint proposalId) external returns (bool success) {
        address topic;
        address destination;
        uint value;
        bytes memory data;
        uint stake;
        bool approved;
        bool executed;
        (topic, destination, value, stake, approved, executed) = proposalManager.getProposal(proposalId);
        //data = proposalManager.getProposalData(proposalId);
        topic.call.value(value)(data);
    }

}