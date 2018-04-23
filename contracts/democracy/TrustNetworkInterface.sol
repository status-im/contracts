pragma solidity ^0.4.21;

import "./DelegationProxyInterface.sol";

contract TrustNetworkInterface {

    function addTopic(bytes32 topicId, bytes32 parentTopic) public;
    function getTopic(bytes32 _topicId) public view returns (DelegationProxyInterface vote, DelegationProxyInterface veto);   
    function getVoteDelegation(bytes32 _topicId) public view returns (DelegationProxyInterface voteDelegation);
    function getVetoDelegation(bytes32 _topicId) public view returns (DelegationProxyInterface vetoDelegation);
}