pragma solidity >=0.5.0 <0.6.0;

import "./Delegation.sol";

contract TrustNetworkInterface {

    function addTopic(bytes32 topicId, bytes32 parentTopic) public;
    function getTopic(bytes32 _topicId) public view returns (Delegation vote, Delegation veto);   
    function getVoteDelegation(bytes32 _topicId) public view returns (Delegation voteDelegation);
    function getVetoDelegation(bytes32 _topicId) public view returns (Delegation vetoDelegation);
}