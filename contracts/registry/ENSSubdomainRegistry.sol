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
    address public parentRegistry;

    uint256 public releaseDelay = 1 years;
    mapping (bytes32 => Domain) public domains;
    mapping (bytes32 => Account) public accounts;
    
    event FundsOwner(bytes32 indexed subdomainhash, address fundsOwner);
    event DomainPrice(bytes32 indexed namehash, uint256 price);
    event DomainMoved(bytes32 indexed namehash, address newRegistry);

    enum NodeState { Free, Owned, Moved }
    struct Domain {
        NodeState state;
        uint256 price;
    }

    struct Account {
        uint256 tokenBalance;
        uint256 creationTime;
        address fundsOwner;
    }

    modifier onlyParentRegistry {
        require(msg.sender == parentRegistry);
        _;
    }

    /** 
     * @notice Initializes a UserRegistry contract 
     * @param _token fee token base 
     * @param _ens Ethereum Name Service root address 
     * @param _resolver Default resolver to use in initial settings
     * @param _parentRegistry Address of old registry (if any) for account migration.
     */
    constructor(
        ERC20Token _token,
        ENS _ens,
        PublicResolver _resolver,
        address _parentRegistry
    ) 
        public 
    {
        token = _token;
        ens = _ens;
        resolver = _resolver;
        parentRegistry = _parentRegistry;
    }

    /**
     * @notice Registers `_userHash` subdomain to `_domainHash` setting msg.sender as owner.
     * @param _userHash choosen unowned subdomain hash 
     * @param _domainHash choosen contract owned domain hash
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
        require(domain.state == NodeState.Owned);
        subdomainHash = keccak256(_domainHash, _userHash);
        require(ens.owner(subdomainHash) == address(0));
        require(accounts[subdomainHash].creationTime == 0);
        accounts[subdomainHash] = Account(domain.price, block.timestamp, msg.sender);
        require(domain.price == 0 || token.allowance(msg.sender, address(this)) >= domain.price);
        
        bool resolvePubkey = _pubkeyA != 0 || _pubkeyB != 0;
        bool resolveAccount = _account != address(0);
        if (resolvePubkey || resolveAccount) {
            //set to self the ownship to setup initial resolver
            ens.setSubnodeOwner(_domainHash, _userHash, address(this));
            ens.setResolver(subdomainHash, resolver); //default resolver
            if (resolveAccount) {
                resolver.setAddr(subdomainHash, _account);
            }
            if (resolvePubkey) {
                resolver.setPubkey(subdomainHash, _pubkeyA, _pubkeyB);
            }
            ens.setOwner(subdomainHash, msg.sender);
        }else {
            //transfer ownship of subdone to registrant
            ens.setSubnodeOwner(_domainHash, _userHash, msg.sender);
        }
        if (domain.price > 0) {   
            //get payment
            require(
                token.transferFrom(
                    address(msg.sender),
                    address(this),
                    domain.price
                )
            );
        }
    }
    
    /** 
     * @notice release subdomain and retrieve locked fee, needs to be called after `releasePeriod` from creation time.
     * @param _userHash `msg.sender` owned subdomain hash 
     * @param _domainHash choosen contract owned domain hash
     */
    function release(
        bytes32 _userHash,
        bytes32 _domainHash
    )
        external 
    {
        bool isDomainController = ens.owner(_domainHash) == address(this);
        bytes32 subdomainHash = keccak256(_domainHash, _userHash);
        Account memory account = accounts[subdomainHash];
        require(account.creationTime > 0);
        if (isDomainController) {
            require(msg.sender == ens.owner(subdomainHash));
            require(account.creationTime + releaseDelay >= block.timestamp);
            ens.setSubnodeOwner(_domainHash, _userHash, address(this));
            ens.setResolver(subdomainHash, address(0));
            ens.setOwner(subdomainHash, address(0));
        } else {
            require(msg.sender == account.fundsOwner);
        }
        delete accounts[subdomainHash];
        if (account.tokenBalance > 0) {
            require(token.transfer(msg.sender, account.tokenBalance));
        }
        
    }

    /** 
     * @notice updates funds owner useful to move subdomain account to new registry.
     * @param _userHash `msg.sender` owned subdomain hash 
     * @param _domainHash choosen contract owned domain hash
     **/
    function updateFundsOwner(
        bytes32 _userHash,
        bytes32 _domainHash
    ) 
        external 
    {
        bytes32 subdomainHash = keccak256(_domainHash, _userHash);
        require(accounts[subdomainHash].creationTime > 0);
        require(msg.sender == ens.owner(subdomainHash));
        require(ens.owner(_domainHash) == address(this));
        accounts[subdomainHash].fundsOwner = msg.sender;
        emit FundsOwner(subdomainHash, msg.sender);

    }    

    /**
     * @notice Migrate account to new registry
     * @param _userHash `msg.sender` owned subdomain hash 
     * @param _domainHash choosen contract owned domain hash
     **/
    function moveAccount(
        bytes32 _userHash,
        bytes32 _domainHash
    ) 
        external 
    {
        bytes32 subdomainHash = keccak256(_domainHash, _userHash);
        require(msg.sender == accounts[subdomainHash].fundsOwner);
        ENSSubdomainRegistry _newRegistry = ENSSubdomainRegistry(ens.owner(_domainHash));
        Account memory account = accounts[subdomainHash];
        delete accounts[subdomainHash];
        require(address(this) == _newRegistry.parentRegistry()); 
        token.approve(_newRegistry, account.tokenBalance);
        _newRegistry.migrateAccount(_userHash, _domainHash, account.tokenBalance, account.creationTime, account.fundsOwner);
    }
    
    /**
        @dev callabe only by parent registry to continue migration of domain
     */
    function migrateDomain(
        bytes32 _domain,
        uint256 _price
    ) 
        external
        onlyParentRegistry
    {
        require(domains[_domain].state == NodeState.Free);
        require(ens.owner(_domain) == address(this));
        domains[_domain] = Domain(NodeState.Owned, _price);
    }
    /**
     * @dev callable only by parent registry for continue user opt-in migration
     * @param _userHash any subdomain hash coming from parent
     * @param _domainHash choosen contract owned domain hash
     * @param _tokenBalance amount being transferred
     * @param _creationTime any value coming from parent
     * @param _fundsOwner fundsOwner for opt-out/release at domain move
     **/
    function migrateAccount(
        bytes32 _userHash,
        bytes32 _domainHash,
        uint256 _tokenBalance,
        uint256 _creationTime,
        address _fundsOwner
    )
        external
        onlyParentRegistry
    {
        bytes32 subdomainHash = keccak256(_domainHash, _userHash);
        accounts[subdomainHash] = Account(_tokenBalance, _creationTime, _fundsOwner);
        if (_tokenBalance > 0) {
            require(token.transferFrom(parentRegistry, address(this), _tokenBalance));
        }
        
    }
     
    /**
     * @notice moves a domain to other Registry (will not move subdomains accounts)
     * @param _newRegistry new registry hodling this domain
     * @param _domain domain being moved
     */
    function moveDomain(
        ENSSubdomainRegistry _newRegistry,
        bytes32 _domain
    ) 
        external
        onlyController
    {
        require(ens.owner(_domain) == address(this));
        require(domains[_domain].state == NodeState.Owned);
        uint256 price = domains[_domain].price;
        domains[_domain].state = NodeState.Moved;
        ens.setOwner(_domain, _newRegistry);
        _newRegistry.migrateDomain(_domain, price);
        emit DomainMoved(_domain, _newRegistry);
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
        require(domains[_domain].state == NodeState.Free);
        require(ens.owner(_domain) == address(this));
        domains[_domain] = Domain(NodeState.Owned, _price);
        emit DomainPrice(_domain, _price);
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
        require(domain.state == NodeState.Owned);
        domain.price = _price;
        emit DomainPrice(_domain, _price);
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

    function getPrice(bytes32 _domainHash) 
        external 
        view 
        returns(uint256 subdomainPrice) 
    {
        subdomainPrice = domains[_domainHash].price;
    }

    function getAccountBalance(bytes32 _subdomainHash)
        external
        view
        returns(uint256 accountBalance) 
    {
        accountBalance = accounts[_subdomainHash].tokenBalance;
    }

    function getFundsOwner(bytes32 _subdomainHash)
        external
        view
        returns(address fundsOwner) 
    {
        fundsOwner = accounts[_subdomainHash].fundsOwner;
    }

    function getCreationTime(bytes32 _subdomainHash)
        external
        view
        returns(uint256 creationTime) 
    {
        creationTime = accounts[_subdomainHash].creationTime;
    }
   
}