pragma solidity ^0.4.23;

import "../common/Controlled.sol";
import "../token/ERC20Token.sol";
import "../ens/ENS.sol";
import "../ens/PublicResolver.sol";

/** 
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @notice Sell ENS subdomains of owned domains.
 */
contract ENSSubdomainRegistry is Controlled {
    
    ERC20Token public token;
    ENS public ens;
    PublicResolver public resolver;
    
    uint256 public releaseDelay = 1 years;
    mapping (bytes32 => Domain) public domains;
    mapping (bytes32 => Account) public accounts;
    
    event Registered(bytes32 indexed _subDomainHash, address _owner);
    event Released(bytes32 indexed _subDomainHash);

    struct Domain {
        bool active;
        uint256 price;
    }

    struct Account {
        uint256 tokenBalance;
        uint256 creationTime;
    }

    /** 
     * @notice Initializes a UserRegistry contract 
     * @param _token fee token base 
     * @param _ens Ethereum Name Service root address 
     * @param _resolver Default resolver to use in initial settings
     */
    constructor(
        ERC20Token _token,
        ENS _ens,
        PublicResolver _resolver
    ) 
        public 
    {
        token = _token;
        ens = _ens;
        resolver = _resolver;
    }

    /**
     * @notice Registers `_userHash` subdomain to `_domainHash` setting msg.sender as owner.
     * @param _userHash choosen unowned subdomain hash 
     * @param _domianHash choosen contract owned domain hash
     * @param _account optional address to set at public resolver
     * @param _pubkeyA optional pubkey part A to set at public resolver
     * @param _pubkeyB optional pubkey part B to set at public resolver
     */
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
        Domain memory domain = domains[_domainHash];
        require(domain.active);
        
        subdomainHash = keccak256(_userHash, _domainHash);
        require(ens.owner(subdomainHash) == address(0));
        require(accounts[subdomainHash].creationTime == 0);
        accounts[subdomainHash] = Account(domain.price, block.timestamp);
        ens.setSubnodeOwner(_domainHash, _userHash, address(this));
        ens.setResolver(subdomainHash, resolver);
        if(_account != address(0)){
            resolver.setAddr(subdomainHash, _account);
        }
        if(_pubkeyA != 0 || _pubkeyB != 0) {
            resolver.setPubkey(subdomainHash, _pubkeyA, _pubkeyB);
        }
        ens.setSubnodeOwner(_domainHash, _userHash, msg.sender);

        require(
            token.transferFrom(
                address(msg.sender),
                address(this),
                domain.price
            )
        );

        emit Registered(subdomainHash, msg.sender);
    }
    
    /** 
     * @notice release subdomain and retrieve locked fee, needs to be called after `releasePeriod` from creation time.
     * @param _userHash `msg.sender` owned subdomain hash 
     * @param _domianHash choosen contract owned domain hash
     */
    function release(
        bytes32 _userHash,
        bytes32 _domainHash
    )
        external 
    {
        bytes32 subdomainHash = keccak256(_userHash, _domainHash);
        require(msg.sender == ens.owner(subdomainHash));
        Account memory account = accounts[subdomainHash];
        require(account.creationTime > 0);
        require(account.creationTime + releaseDelay > block.timestamp);
        delete accounts[subdomainHash];

        ens.setSubnodeOwner(_domainHash, _userHash, address(this));
        ens.setResolver(subdomainHash, address(0));
        ens.setSubnodeOwner(_domainHash, _userHash, address(0));
        
        require(token.transfer(msg.sender, account.tokenBalance));
        emit Released(subdomainHash);
    }
    
    /** 
     * @notice Controller include new domain available to register
     * @param _domain domain owned by user registry being activated
     * @param _price cost to register subnode from this node
     */
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

    /**
     * @notice updates domain price
     * @param _domain active domain being defined price
     * @param _price new price
     */
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


    /**
     * @notice removes a domain from available (will not remove current sold subdomains)
     * @param _domain domain being deactivated
     * @param _newOwner new address hodling this domain
     */
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

    /** 
     * @notice updates default public resolver for newly registred subdomains
     * @param _resolver new default resolver  
     */
    function setResolver(
        address _resolver
    ) 
        external
        onlyController
    {
        resolver = PublicResolver(_resolver);
    }    
   
}