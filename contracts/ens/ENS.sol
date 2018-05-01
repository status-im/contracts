pragma solidity ^0.4.21;

interface ENS {

    // Logged when the owner of a node assigns a new owner to a subnode.
    event NewOwner(bytes32 indexed node, bytes32 indexed label, address owner);

    // Logged when the owner of a node transfers ownership to a new account.
    event Transfer(bytes32 indexed node, address owner);

    // Logged when the resolver for a node changes.
    event NewResolver(bytes32 indexed node, address resolver);

    // Logged when the TTL of a node changes
    event NewTTL(bytes32 indexed node, uint64 ttl);

    function setOwner(bytes32 _node, address _owner) external;
    function setSubnodeOwner(bytes32 _node, bytes32 _label, address _owner) external;
    function setResolver(bytes32 _node, address _resolver) external;
    function setTTL(bytes32 _node, uint64 _ttl) external;
    function owner(bytes32 _node) external view returns (address);
    function resolver(bytes32 _node) external view returns (address);
    function ttl(bytes32 _node) external view returns (uint64);
}
