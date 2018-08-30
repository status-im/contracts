pragma solidity ^0.4.23;

import "../common/MerkleProof.sol";
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

    uint256 public releaseDelay = 365 days;
    mapping (bytes32 => Domain) public domains;
    mapping (bytes32 => Account) public accounts;
    
    //slashing conditions
    uint256 public subdomainMinLenght;
    bytes32[] public reservedSubdomainsMerkleRoots;
    
    event DomainPrice(bytes32 indexed namehash, uint256 price);
    event DomainMoved(bytes32 indexed namehash, address newRegistry);
    event SubdomainOwner(bytes32 subdomainHash, address accountOwner);

    enum NodeState { Free, Owned, Moved }
    struct Domain {
        NodeState state;
        uint256 price;
    }

    struct Account {
        uint256 tokenBalance;
        uint256 creationTime;
        address accountOwner;
    }

    modifier onlyParentRegistry {
        require(msg.sender == parentRegistry, "Migration only.");
        _;
    }

    /** 
     * @notice Initializes a UserRegistry contract 
     * @param _token fee token base 
     * @param _ens Ethereum Name Service root address 
     * @param _resolver Default resolver to use in initial settings
     * @param _subdomainMinLenght Minimum length of usernames 
     * @param _reservedSubdomainsMerkleRoots Merkle Roots of reserved subdomains 
     * @param _parentRegistry Address of old registry (if any) for account migration.
     */
    constructor(
        ERC20Token _token,
        ENS _ens,
        PublicResolver _resolver,
        uint256 _subdomainMinLenght,
        bytes32[] _reservedSubdomainsMerkleRoots,
        address _parentRegistry
    ) 
        public 
    {
        token = _token;
        ens = _ens;
        resolver = _resolver;
        subdomainMinLenght = _subdomainMinLenght;
        reservedSubdomainsMerkleRoots = _reservedSubdomainsMerkleRoots;
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
        require(domain.state == NodeState.Owned, "Domain unavailable.");
        subdomainHash = keccak256(abi.encodePacked(_domainHash, _userHash));
        require(ens.owner(subdomainHash) == address(0), "ENS node already owned.");
        require(accounts[subdomainHash].creationTime == 0, "Username already registered.");
        accounts[subdomainHash] = Account(domain.price, block.timestamp, msg.sender);
        if(domain.price > 0) {
            require(token.allowance(msg.sender, address(this)) >= domain.price, "Unallowed to spend.");
            require(
                token.transferFrom(
                    address(msg.sender),
                    address(this),
                    domain.price
                ),
                "Transfer failed"
            );
        } 
    
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
            //transfer ownship of subdone directly to registrant
            ens.setSubnodeOwner(_domainHash, _userHash, msg.sender);
        }
        emit SubdomainOwner(subdomainHash, msg.sender);
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
        bytes32 subdomainHash = keccak256(abi.encodePacked(_domainHash, _userHash));
        Account memory account = accounts[subdomainHash];
        require(account.creationTime > 0, "Username not registered.");
        if (isDomainController) {
            require(msg.sender == ens.owner(subdomainHash), "Not owner of ENS node.");
            require(block.timestamp > account.creationTime + releaseDelay, "Release period not reached.");
            ens.setSubnodeOwner(_domainHash, _userHash, address(this));
            ens.setResolver(subdomainHash, address(0));
            ens.setOwner(subdomainHash, address(0));
        } else {
            require(msg.sender == account.accountOwner, "Not the former account owner.");
        }
        delete accounts[subdomainHash];
        if (account.tokenBalance > 0) {
            require(token.transfer(msg.sender, account.tokenBalance), "Transfer failed");
        }
        emit SubdomainOwner(subdomainHash, address(0));
        
    }

    /** 
     * @notice updates funds owner, useful to move subdomain account to new registry.
     * @param _userHash `msg.sender` owned subdomain hash 
     * @param _domainHash choosen contract owned domain hash
     **/
    function updateAccountOwner(
        bytes32 _userHash,
        bytes32 _domainHash
    ) 
        external 
    {
        bytes32 subdomainHash = keccak256(abi.encodePacked(_domainHash, _userHash));
        require(accounts[subdomainHash].creationTime > 0, "Username not registered.");
        require(msg.sender == ens.owner(subdomainHash), "Caller not owner of ENS node.");
        require(ens.owner(_domainHash) == address(this), "Registry not owner of domain.");
        accounts[subdomainHash].accountOwner = msg.sender;
        emit SubdomainOwner(subdomainHash, msg.sender);
    }  
    
    /**
     * @notice slash account due too length restriction 
     * @param _subdomain raw value of offending subdomain
     * @param _domainHash domain hash
     */
    function slashSmallSubdomain(
        bytes _subdomain,
        bytes32 _domainHash
    ) 
        external 
    {
        require(_subdomain.length < subdomainMinLenght, "Not a small subdomain.");
        slashSubdomain(_subdomain, _domainHash);
    }

    /**
     * @notice slash account due look like an address 
     * @param _subdomain raw value of offending subdomain
     * @param _domainHash domain hash
     */
    function slashAddressLikeSubdomain(
        string _subdomain,
        bytes32 _domainHash
    ) 
        external 
    {
        bytes memory subdomain = bytes(_subdomain);
        require(subdomain.length > 7, "Too small to look like an address.");
        require(subdomain[0] == byte("0"), "First character need to be 0");
        require(subdomain[1] == byte("x"), "Second character need to be x");
        for(uint i = 2; i < 7; i++){
            byte b = subdomain[i];
            require((b >= 48 && b <= 57) || (b >= 97 && b <= 102), "Does not look like an address");
        }
        slashSubdomain(subdomain, _domainHash);
    }  

    /**
     * @notice slash account due reserved name
     * @param _subdomain raw value of offending subdomain
     * @param _domainHash domain hash
     */
    function slashReservedSubdomain(
        bytes _subdomain,
        bytes32 _domainHash,
        uint256 _rootPos,
        bytes32[] _proof
    ) 
        external 
    {
        require(reservedSubdomainsMerkleRoots.length > _rootPos, "Invalid Merkle Root");
        require(
            MerkleProof.verifyProof(
                _proof,
                reservedSubdomainsMerkleRoots[_rootPos],
                keccak256(_subdomain)
            ),
            "Invalid Proof."
        );
        slashSubdomain(_subdomain, _domainHash);
    }

    /**
     * @notice slash account of invalid subdomain
     * @param _subdomain raw value of offending subdomain
     * @param _domainHash domain hash
     * @param _offendingPos position of invalid character
     */
    function slashInvalidSubdomain(
        bytes _subdomain,
        bytes32 _domainHash,
        uint256 _offendingPos
    ) 
        external
    { 
        require(_subdomain.length > _offendingPos, "Invalid position.");
        byte b = _subdomain[_offendingPos];
        
        require(!((b >= 48 && b <= 57) || (b >= 97 && b <= 122)), "Not invalid character.");
    
        slashSubdomain(_subdomain, _domainHash);
    }

    function slashSubdomain(bytes _subdomain, bytes32 _domainHash) internal {
        bytes32 userHash = keccak256(_subdomain);
        bytes32 subdomainHash = keccak256(abi.encodePacked(_domainHash, userHash));
        require(accounts[subdomainHash].creationTime > 0, "Username not registered.");
        
        ens.setSubnodeOwner(_domainHash, userHash, address(this));
        ens.setResolver(subdomainHash, address(0));
        ens.setOwner(subdomainHash, address(0));
        
        uint256 amountToTransfer = accounts[subdomainHash].tokenBalance;
        delete accounts[subdomainHash];
        if(amountToTransfer > 0){
            require(token.transfer(msg.sender, amountToTransfer), "Error in transfer.");   
        }
        emit SubdomainOwner(subdomainHash, address(0));
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
        bytes32 subdomainHash = keccak256(abi.encodePacked(_domainHash, _userHash));
        require(msg.sender == accounts[subdomainHash].accountOwner, "Callable only by account owner.");
        ENSSubdomainRegistry _newRegistry = ENSSubdomainRegistry(ens.owner(_domainHash));
        Account memory account = accounts[subdomainHash];
        delete accounts[subdomainHash];
        //require(address(this) == _newRegistry.parentRegistry(), "Wrong update."); 
        token.approve(_newRegistry, account.tokenBalance);
        _newRegistry.migrateAccount(
            _userHash,
            _domainHash,
            account.tokenBalance,
            account.creationTime,
            account.accountOwner
        );
    }
    
    /**
     * @dev callabe only by parent registry to continue migration of domain
     **/
    function migrateDomain(
        bytes32 _domain,
        uint256 _price
    ) 
        external
        onlyParentRegistry
    {
        require(ens.owner(_domain) == address(this), "ENS domain owner not transfered.");
        assert(domains[_domain].state == NodeState.Free);
        domains[_domain] = Domain(NodeState.Owned, _price);
    }

    /**
     * @dev callable only by parent registry for continue user opt-in migration
     * @param _userHash any subdomain hash coming from parent
     * @param _domainHash choosen contract owned domain hash
     * @param _tokenBalance amount being transferred
     * @param _creationTime any value coming from parent
     * @param _accountOwner accountOwner for opt-out/release at domain move
     **/
    function migrateAccount(
        bytes32 _userHash,
        bytes32 _domainHash,
        uint256 _tokenBalance,
        uint256 _creationTime,
        address _accountOwner
    )
        external
        onlyParentRegistry
    {
        bytes32 subdomainHash = keccak256(abi.encodePacked(_domainHash, _userHash));
        accounts[subdomainHash] = Account(_tokenBalance, _creationTime, _accountOwner);
        if (_tokenBalance > 0) {
            require(
                token.transferFrom(
                    parentRegistry,
                    address(this),
                    _tokenBalance
                ), 
                "Error moving funds from old registar."
            );
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
        require(domains[_domain].state == NodeState.Owned, "Wrong domain");
        require(ens.owner(_domain) == address(this), "Domain not owned anymore.");
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
    function setDomainPrice(
        bytes32 _domain,
        uint256 _price
    ) 
        external
        onlyController
    {
        require(domains[_domain].state == NodeState.Free, "Domain state is not free");
        require(ens.owner(_domain) == address(this), "Registry does not own domain");
        domains[_domain] = Domain(NodeState.Owned, _price);
        emit DomainPrice(_domain, _price);
    }

    /**
     * @notice updates domain price
     * @param _domain active domain being defined price
     * @param _price new price
     */
    function updateDomainPrice(
        bytes32 _domain,
        uint256 _price
    ) 
        external
        onlyController
    {
        Domain storage domain = domains[_domain];
        require(domain.state == NodeState.Owned, "Domain not owned");
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

    function getAccountOwner(bytes32 _subdomainHash)
        external
        view
        returns(address accountOwner) 
    {
        accountOwner = accounts[_subdomainHash].accountOwner;
    }

    function getCreationTime(bytes32 _subdomainHash)
        external
        view
        returns(uint256 creationTime) 
    {
        creationTime = accounts[_subdomainHash].creationTime;
    }

    function getExpirationTime(bytes32 _subdomainHash)
        external
        view
        returns(uint256 expirationTime)
    {
        expirationTime = accounts[_subdomainHash].creationTime + releaseDelay;
    }

}
