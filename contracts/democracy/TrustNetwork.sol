pragma solidity >=0.5.0 <0.6.0;

import "../common/Controlled.sol";
import "./TrustNetworkInterface.sol";
import "./Delegation.sol";
import "./DelegationFactory.sol";


/**
 * @title TrustNetwork
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * Defines two contolled Delegation chains: vote and veto chains.
 * New layers need to be defined under a unique topic address topic, and all fall back to root topic (topic 0x0)   
 */
contract TrustNetwork is TrustNetworkInterface, Controlled {
    mapping (bytes32 => Topic) topics;
    DelegationFactory delegationFactory;
    
    struct Topic {
        Delegation voteDelegation;
        Delegation vetoDelegation;
    }
    
    constructor(DelegationFactory _delegationFactory, Delegation defaultDelegation) public {
        delegationFactory = _delegationFactory;
        topics[bytes32(0)] = newTopic(defaultDelegation, defaultDelegation);
    }
    
    function addTopic(bytes32 topicId, bytes32 parentTopic) public onlyController {
        Topic memory parent = topics[parentTopic];
        address vote = address(parent.voteDelegation);
        address veto = address(parent.vetoDelegation);
        require(vote != address(0));
        require(veto != address(0));

        Topic storage topic = topics[topicId]; 
        require(address(topic.voteDelegation) == address(0));
        require(address(topic.vetoDelegation) == address(0));

        topics[topicId] = newTopic(vote, veto);
    }
    
    function getTopic(bytes32 _topicId) public view returns (Delegation vote, Delegation veto) {
        Topic memory topic = topics[_topicId];
        vote = topic.voteDelegation;
        veto = topic.vetoDelegation;
    }

    function getVoteDelegation(
        bytes32 _topicId
    )
        public
        view
        returns (Delegation voteDelegation) 
    {
        return topics[_topicId].voteDelegation;
    }

    function getVetoDelegation(
        bytes32 _topicId
    )
        public
        view 
        returns (Delegation vetoDelegation)
    {
        return topics[_topicId].vetoDelegation;
    }

    
    function newTopic(Delegation _vote, Delegation _veto) internal returns (Topic memory topic) {
        topic = Topic ({ 
            voteDelegation: Delegation(address(delegationFactory.createDelegation(address(_vote)))),
            vetoDelegation: Delegation(address(delegationFactory.createDelegation(address(_vote))))
        });
    }

    

    


}