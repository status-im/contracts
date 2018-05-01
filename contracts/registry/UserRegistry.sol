pragma solidity ^0.4.23;

import "../common/Controlled.sol";
import "../token/ERC20Token.sol";
import "../ens/ENS.sol";
import "../ens/ResolverInterface.sol";


contract SubdomainRegistry is Controlled {
    
    struct Domain {
        bool active;
        uint256 price;
    }

    mapping (bytes32 => Domain) public domains;
    mapping (bytes32 => address) public registry;
    mapping (bytes32 => address) public taken;
    
    ERC20Token public token;
    ENS public ens;
    ResolverInterface public resolver;
    
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
            ENS(_ens),
            ResolverInterface(_resolver),
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
        
        subdomainHash = keccak256(_userHash, _domainHash);
        require(taken[subdomainHash] == address(0));
        taken[subdomainHash] = address(msg.sender);

        address currentOwner = ens.owner(subdomainHash);
        require(currentOwner == 0 || currentOwner == msg.sender);

        ens.setSubnodeOwner(_domainHash, _userHash, address(this));
        ens.setResolver(subdomainHash, resolver);
        resolver.setAddr(subdomainHash, address(msg.sender));

        require(
            token.transferFrom(
                address(msg.sender),
                address(this),
                domain.price
            )
        );
        
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
        ResolverInterface(resolver).setAddr(_subdomainHash, _newContract);
    }
    
    function addDomain(
        bytes32 _domain,
        uint256 _price
    ) 
        external
        onlyController
    {
        require(!domains[_domain].active);
        require(ens.owner(_domain) == address(this));
        domains[_domain] = Domain(true, _price);
    }

    function removeDomain(
        bytes32 _domain,
        address _newOwner
    ) 
        external
        onlyController
    {
        require(ens.owner(_domain) == address(this));
        ens.setOwner(_domain, _newOwner);
        delete domains[_domain];
    }

    function setResolver(
        address _resolver
    ) 
        external
        onlyController
    {
        resolver = ResolverInterface(_resolver);
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
        ENS _ens,
        ResolverInterface _resolver,
        address _controller
    ) 
        public
    {
        require(controller == 0x0);
        require(address(ens) == 0x0);
        require(address(token) == 0x0);
        require(address(resolver) == 0x0);
        controller = _controller;
        token = _token;
        ens = _ens;
        resolver = _resolver;
    }
    
}