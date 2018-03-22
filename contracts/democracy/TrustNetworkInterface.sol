pragma solidity ^0.4.17;

import "./DelegationProxyInterface.sol";

contract TrustNetworkInterface {

    function addTopic(bytes32 topicId, bytes32 parentTopic) public;
    function getTopic(bytes32 _topicId) public constant returns (DelegationProxyInterface vote, DelegationProxyInterface veto);   

}