pragma solidity ^0.4.21;

import "./DelegationInterface.sol";

contract TrustNetworkInterface {

    function addTopic(bytes32 topicId, bytes32 parentTopic) public;
    function getTopic(bytes32 _topicId) public view returns (DelegationInterface vote, DelegationInterface veto);   
    function getVoteDelegation(bytes32 _topicId) public view returns (DelegationInterface voteDelegation);
    function getVetoDelegation(bytes32 _topicId) public view returns (DelegationInterface vetoDelegation);
}