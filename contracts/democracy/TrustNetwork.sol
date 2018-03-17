pragma solidity ^0.4.10;

import "../common/Controlled.sol";
import "./DelegationProxyFactory.sol";
import "./DelegationProxy.sol";

/**
 * @title TrustNetwork
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * Defines two contolled DelegationProxy chains: vote and veto chains.
 * New layers need to be defined under a unique topic address topic, and all fall back to root topic (topic 0x0)   
 */
contract TrustNetwork is Controlled {
    mapping (bytes32 => Topic) topics;
    DelegationProxyFactory delegationFactory;
    
    struct Topic {
        DelegationProxy voteProxy;
        DelegationProxy vetoProxy;
    }
    
    function TrustNetwork(address _delegationFactory) public {
        delegationFactory = DelegationProxyFactory(_delegationFactory);
        topics[0x0] = newTopic(0x0, 0x0);
    }
    
    function addTopic(bytes32 topicId, bytes32 parentTopic) public onlyController {
        Topic memory parent = topics[parentTopic];
        address vote = address(parent.voteProxy);
        address veto = address(parent.vetoProxy);
        require(vote != 0x0);
        require(veto != 0x0);

        Topic storage topic = topics[topicId]; 
        require(address(topic.voteProxy) == 0x0);
        require(address(topic.vetoProxy) == 0x0);


        topics[topicId] = newTopic(vote, veto);
    }
    
    function getTopic(bytes32 _topicId) public constant returns (DelegationProxy vote, DelegationProxy veto) {
        Topic memory topic = topics[_topicId];
        vote = topic.voteProxy;
        veto = topic.vetoProxy;
    }

    function newTopic(address _vote, address _veto) internal returns (Topic topic) {
        topic = Topic ({ 
            voteProxy: delegationFactory.create(_vote),
            vetoProxy: delegationFactory.create(_veto)
        });
    }

    


}