pragma solidity ^0.4.17;

import "../ens/UsingENS.sol";
import "../ens/AbstractENS.sol";
import "../ens/PublicResolverInterface.sol";
import "../status/UsingSNT.sol";
import "../identity/Identity.sol";

contract UserRegistry is UsingENS, UsingSNT {
    address public owner = 0x0;
    address public ENSroot = 0x0;
    address public SNT = 0x0;
    address public resolver = 0x0;
    mapping (bytes32 => bool) public domains;
    mapping (bytes32 => address) public registry;
    mapping (bytes32 => bool) public taken;
    uint public price = 1000 * 10**18;

    modifier onlyOwner {
        require(msg.sender == owner);
    }

    function UserRegistry(address _resolver) public {
        initialize(_resolver);
    }

    function initialize(address _resolver) public {
        require(owner == 0x0);
        require(ENSroot == 0x0);
        require(SNT == 0x0);
        require(resolver == 0x0);
        ENSroot = ensAddress();
        SNT = sntAddress();
        resolver = _resolver;
        owner = msg.sender;
    }

    function registerUser(string _user, bytes32 _domain) public {
        require(domains[_domain]);
        SNT snt = SNT(SNT);
        require(snt.transferFrom(msg.sender, address(this), price));
        ENS ens = ENS(ENSroot);
        bytes32 user = keccak256(_user);
        ens.setSubnodeOwner(_domain, user, address(this));
        bytes32 subdomain = keccak256(_user, _domain);
        ens.setResolver(subdomain, resolver);
        Identity newIdentity = new Identity(msg.sender);
        PublicResolverInterface(resolver).setAddr(address(newIdentity));
        taken[user] = true;
    }

    function listDomain(bytes32 _domain) public onlyOwner {
        require(ENS(ENSroot).owner(_domain) == address(this));
        domains[_domain] = true;
    }

    function recoverDomain(bytes32 _domain, address _dest) public onlyOwner {
        require(domains[_domain]);
        ENS(ENSroot).setOwner(_domain, _dest);
        delete domains[_domain];
    }

    function setPrice(uint256 _price) public onlyOwner {
        price = _price;
    }
    
    function setOwner(address _newOwner) public onlyOwner {
        require(_newOwner != 0x0);
        owner = _newOwner;
    }
}