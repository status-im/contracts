pragma solidity ^0.4.17;

import "../deploy/BasicSystemStorage.sol";
import "../token/MiniMeToken.sol";
import "../democracy/TrustNetworkModel.sol";
import "../democracy/ProposalManager.sol";
import "../democracy/ProposalExecutor.sol";
import "../registry/TokenRegistry.sol";


/**
 * @title StatusConstitution
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @dev 
 */
contract StatusConstitution is BasicSystemStorage, ProposalExecutor {
    
    MiniMeToken public SNT ;
    TrustNetworkModel public trustNet = TrustNetworkModel(0x0);
    ProposalManager proposalManager;
    address public stakeBank;

    function StatusConstitution(address _statusNetworkToken, address _statusNetworkTrust, address _stakeBank) public {
        SNT = MiniMeToken(_statusNetworkToken);
        trustNet = TrustNetworkModel(_statusNetworkTrust);
        stakeBank = _stakeBank; 
        proposalManager = new ProposalManager(SNT, trustNet, stakeBank);
        TokenRegistry tokenReg = new TokenRegistry();
        trustNet.addTopic(address(tokenReg), 0x0);
    }

    function executeProposal(address topic, uint value, bytes data) external returns (bool success) {
        require(msg.sender == address(proposalManager));
        return topic.call.value(value)(data);
    }

}