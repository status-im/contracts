pragma solidity ^0.4.17;

contract PublicResolverInterface {
    function supportsInterface(bytes4 interfaceID) public constant returns (bool);
    function addr(bytes32 node) public constant returns (address ret);
    function setAddr(bytes32 node, address addr) public;
    function hash(bytes32 node) public constant returns (bytes32 ret);
    function setHash(bytes32 node, bytes32 hash) public;
}
