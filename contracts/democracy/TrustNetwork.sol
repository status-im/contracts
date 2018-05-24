pragma solidity ^0.4.21;

import "../common/Controlled.sol";
import "./TrustNetworkInterface.sol";
import "./DelegationProxyInterface.sol";
import "./DelegationProxyFactory.sol";


/**
 * @title TrustNetwork
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * Defines two contolled DelegationProxy chains: vote and veto chains.
 * New layers need to be defined under a unique topic address topic, and all fall back to root topic (topic 0x0)   
 */
contract TrustNetwork is TrustNetworkInterface, Controlled {
    mapping (bytes32 => Topic) topics;
    DelegationProxyFactory delegationFactory;
    
    struct Topic {
        DelegationProxyInterface voteDelegation;
        DelegationProxyInterface vetoDelegation;
    }
    
    constructor(address _delegationFactory) public {
        delegationFactory = DelegationProxyFactory(_delegationFactory);
        topics[0x0] = newTopic(0x0, 0x0);
    }
    
    function addTopic(bytes32 topicId, bytes32 parentTopic) public onlyController {
        Topic memory parent = topics[parentTopic];
        address vote = address(parent.voteDelegation);
        address veto = address(parent.vetoDelegation);
        require(vote != 0x0);
        require(veto != 0x0);

        Topic storage topic = topics[topicId]; 
        require(address(topic.voteDelegation) == 0x0);
        require(address(topic.vetoDelegation) == 0x0);

        topics[topicId] = newTopic(vote, veto);
    }
    
    function getTopic(bytes32 _topicId) public view returns (DelegationProxyInterface vote, DelegationProxyInterface veto) {
        Topic memory topic = topics[_topicId];
        vote = topic.voteDelegation;
        veto = topic.vetoDelegation;
    }

    function getVoteDelegation(
        bytes32 _topicId
    )
        public
        view
        returns (DelegationProxyInterface voteDelegation) 
    {
        return topics[_topicId].voteDelegation;
    }

    function getVetoDelegation(
        bytes32 _topicId
    )
        public
        view 
        returns (DelegationProxyInterface vetoDelegation)
    {
        return topics[_topicId].vetoDelegation;
    }

    
    function newTopic(address _vote, address _veto) internal returns (Topic topic) {
        topic = Topic ({ 
            voteDelegation: delegationFactory.createDelegationProxy(_vote),
            vetoDelegation: delegationFactory.createDelegationProxy(_veto)
        });
    }

    

    


}