pragma solidity >=0.5.0 <0.6.0;

import "../common/Controlled.sol";
import "./TrustNetworkInterface.sol";
import "./DelegationInterface.sol";
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
        DelegationInterface voteDelegation;
        DelegationInterface vetoDelegation;
    }
    
    constructor(address _delegationFactory) public {
        delegationFactory = DelegationFactory(_delegationFactory);
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
    
    function getTopic(bytes32 _topicId) public view returns (DelegationInterface vote, DelegationInterface veto) {
        Topic memory topic = topics[_topicId];
        vote = topic.voteDelegation;
        veto = topic.vetoDelegation;
    }

    function getVoteDelegation(
        bytes32 _topicId
    )
        public
        view
        returns (DelegationInterface voteDelegation) 
    {
        return topics[_topicId].voteDelegation;
    }

    function getVetoDelegation(
        bytes32 _topicId
    )
        public
        view 
        returns (DelegationInterface vetoDelegation)
    {
        return topics[_topicId].vetoDelegation;
    }

    
    function newTopic(address _vote, address _veto) internal returns (Topic topic) {
        topic = Topic ({ 
            voteDelegation: delegationFactory.createDelegation(_vote),
            vetoDelegation: delegationFactory.createDelegation(_veto)
        });
    }

    

    


}