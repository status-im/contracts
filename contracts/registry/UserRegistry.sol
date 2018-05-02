pragma solidity ^0.4.23;

import "../common/Controlled.sol";
import "../token/ERC20Token.sol";
import "../ens/ENS.sol";
import "../ens/PublicResolver.sol";


contract SubdomainRegistry is Controlled {
    
    struct Domain {
        bool active;
        uint256 price;
    }

    mapping (bytes32 => Domain) public domains;
    mapping (bytes32 => address) public registry;
    mapping (bytes32 => address) public owner;
    
    ERC20Token public token;
    ENS public ens;
    PublicResolver public resolver;
    
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
            PublicResolver(_resolver),
            address(msg.sender)
        );
    }

    function register(
        bytes32 _userHash,
        bytes32 _domainHash,
        address _account,
        bytes32 _pubkeyA,
        bytes32 _pubkeyB
    ) 
        external 
        returns(bytes32 subdomainHash) 
    {
        return _register(_userHash, _domainHash, msg.sender, _account, _pubkeyA, _pubkeyB);
    }
    
    function _register(
        bytes32 _userHash,
        bytes32 _domainHash,
        address _owner,
        address _account,
        bytes32 _pubkeyA,
        bytes32 _pubkeyB
    ) 
        internal 
        returns(bytes32 subdomainHash)
    {
        Domain memory domain = domains[_domainHash];
        require(domain.active);
        
        subdomainHash = keccak256(_userHash, _domainHash);
        require(owner[subdomainHash] == address(0));
        owner[subdomainHash] = _owner;

        address currentOwner = ens.owner(subdomainHash);
        require(currentOwner == 0);

        ens.setSubnodeOwner(_domainHash, _userHash, address(this));
        ens.setResolver(subdomainHash, resolver);

        if(_account != address(0)){
            resolver.setAddr(subdomainHash, _account);
        }
        if(_pubkeyA != 0 || _pubkeyB != 0) {
            resolver.setPubkey(subdomainHash, _pubkeyA, _pubkeyB);
        }
        
        require(
            token.transferFrom(
                address(msg.sender),
                address(this),
                domain.price
            )
        );
        
        emit Registered(subdomainHash, _owner);
    }

    function claimSubnodeOwnership(
        bytes32 _userHash,
        bytes32 _domainHash
    ) 
        external 
    {
        bytes32 subdomainHash = keccak256(_userHash, _domainHash);
        address currentOwner = owner[subdomainHash];
        require(currentOwner == msg.sender);
        ens.setSubnodeOwner(_domainHash, _userHash, currentOwner);
    }

    function update(
        bytes32 _subdomainHash,
        address _newContract
    ) 
        external
    {
        require(
            msg.sender == owner[_subdomainHash] &&
            address(this) == ens.owner(_subdomainHash)
        );
        PublicResolver(resolver).setAddr(_subdomainHash, _newContract);
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
        resolver = PublicResolver(_resolver);
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
        PublicResolver _resolver,
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