pragma solidity ^0.4.23;

import "../common/Controlled.sol";
import "../token/ERC20Token.sol";
import "../ens/AbstractENS.sol";
import "../ens/PublicResolverInterface.sol";


contract SubdomainRegistry is Controlled {
    
    struct Domain {
        bool active;
        uint256 price;
    }

    mapping (bytes32 => Domain) public domains;
    mapping (bytes32 => address) public registry;
    mapping (bytes32 => address) public taken;
    
    ERC20Token public token;
    AbstractENS public ENSroot;
    PublicResolverInterface public resolver;
    
    event Registered(bytes32 indexed _subDomainHash, address _identity);

    constructor(
        address _token,
        address _ens,
        address _resolver
    ) 
        public 
    {
        initialize(
            ERC20Token(_token),
            AbstractENS(_ens),
            PublicResolverInterface(_resolver),
            address(msg.sender)
        );
    }

    function register(
        bytes32 _userHash,
        bytes32 _domainHash
    ) 
        external 
        returns(bytes32 subdomainHash) 
    {
        
        Domain memory domain = domains[_domainHash];
        require(domain.active);

        require(
            token.transferFrom(
                address(msg.sender),
                address(this),
                domain.price
            )
        );
        
        subdomainHash = keccak256(_userHash, _domainHash);
        require(taken[subdomainHash] == address(0));
        taken[subdomainHash] = address(msg.sender);

        ENSroot.setSubnodeOwner(_domainHash, _userHash, address(this));
        ENSroot.setResolver(subdomainHash, resolver);
        resolver.setAddr(subdomainHash, address(msg.sender));
        
        emit Registered(subdomainHash, address(msg.sender));
    }
    
    function update(
        bytes32 _subdomainHash,
        address _newContract
    ) 
        external
    {
        require(
            msg.sender == taken[_subdomainHash] ||
            msg.sender == controller
        );
        require(PublicResolverInterface(resolver).addr(_subdomainHash) == msg.sender);
        PublicResolverInterface(resolver).setAddr(_subdomainHash, _newContract);
    }
    
    function addDomain(
        bytes32 _domain,
        uint256 _price
    ) 
        external
        onlyController
    {
        require(!domains[_domain].active);
        require(ENSroot.owner(_domain) == address(this));
        domains[_domain] = Domain(true, _price);
    }

    function removeDomain(
        bytes32 _domain,
        address _newOwner
    ) 
        external
        onlyController
    {
        require(ENSroot.owner(_domain) == address(this));
        ENSroot.setOwner(_domain, _newOwner);
        delete domains[_domain];
    }

    function setResolver(
        address _resolver
    ) 
        external
        onlyController
    {
        resolver = PublicResolverInterface(_resolver);
    }    

    function setDomainPrice(
        bytes32 _domain,
        uint256 _price
    ) 
        external
        onlyController
    {
        Domain storage domain = domains[_domain];
        require(domain.active);
        domain.price = _price;
    }

    function initialize(
        ERC20Token _token,
        AbstractENS _ens,
        PublicResolverInterface _resolver,
        address _controller
    ) 
        public
    {
        require(controller == 0x0);
        require(address(ENSroot) == 0x0);
        require(address(token) == 0x0);
        require(address(resolver) == 0x0);
        controller = _controller;
        token = _token;
        ENSroot = _ens;
        resolver = _resolver;
    }
    
}