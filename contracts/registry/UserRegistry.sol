pragma solidity ^0.4.17;

import "../ens/UsingENS.sol";
import "../ens/AbstractENS.sol";
import "../ens/PublicResolverInterface.sol";
import "../status/UsingSNT.sol";
import "../identity/Identity.sol";

contract UserRegistry is UsingENS, UsingSNT {
    event Registered(bytes32 indexed _domain, string _userName, address identity);
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


    function registerUser(string _userName, bytes32 _domainHash) public returns(address) {
        bytes32 subdomainHash = register(_userName, _domainHash);
        Identity newIdentity = new Identity(msg.sender);
        PublicResolverInterface(resolver).setAddr(subdomainHash, address(newIdentity));
        Registered(_domainHash, _userName, newIdentity);
    }


    function registerUser(string _userName, bytes32 _domainHash, address _identity) public {
        bytes32 subdomainHash = register(_userName, _domainHash);
        PublicResolverInterface(resolver).setAddr(subdomainHash, _identity);
        Registered(_domainHash, _userName, _identity);
    }


    function register(string _userName, bytes32 _domainHash) private returns(bytes32 subdomainHash) {
        require(domains[_domainHash ]);
        SNT snt = SNT(SNT);
        require(snt.transferFrom(msg.sender, address(this), price));
        ENS ens = ENS(ENSroot);
        bytes32 userHash = keccak256(_userName);
        subdomainHash = keccak256(_userName, _domainHash);
        require(taken[subdomainHash] == false);
        taken[subdomain] = true;
        ens.setSubnodeOwner(_domainHash, userHash, address(this));
        ens.setResolver(subdomainHash, resolver);
    }


    function updateUser(string _userName, bytes32 _domainHash, address _newContract) public {
        bytes32 subdomainHash = keccak256(_userName, _domainHash);
        require(taken[subdomainHash]);
        require(PublicResolverInterface(resolver).addr(subdomainHash) == msg.sender);
        PublicResolverInterface(resolver).setAddr(subdomainHash, _newContract);
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