pragma solidity ^0.4.17;

import "./Resolver.sol";


contract ENS {
    function owner(bytes32 node) public constant returns (address);
    function resolver(bytes32 node) public constant returns (Resolver);
    function ttl(bytes32 node) public constant returns (uint64);
    function setOwner(bytes32 node, address owner) public;
    function setSubnodeOwner(bytes32 node, bytes32 label, address owner) public;
    function setResolver(bytes32 node, address resolver) public;
    function setTTL(bytes32 node, uint64 ttl) public;
}