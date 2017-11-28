pragma solidity ^0.4.10;

import "./TrustNetwork.sol";
import "../deploy/KillableModel.sol";

/**
 * @title TrustNetworkModel
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * Model for TrustNetwork 
 */
contract TrustNetworkModel is KillableModel, TrustNetwork {

    
    function TrustNetworkModel(address _watchdog) KillableModel(_watchdog) TrustNetwork(0x0) public {
        
    }

    function create(address _delegationFactory) public {
        require(topics[0x0].voteProxy == address(0x0));
        delegationFactory = DelegationProxyFactory(_delegationFactory);
        topics[0x0] = newTopic(0x0, 0x0);
    }
    


}