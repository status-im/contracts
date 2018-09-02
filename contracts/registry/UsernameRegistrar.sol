pragma solidity ^0.4.24;

import "../common/MerkleProof.sol";
import "../common/Controlled.sol";
import "../token/ERC20Token.sol";
import "../token/ApproveAndCallFallBack.sol";
import "../ens/ENS.sol";
import "../ens/PublicResolver.sol";

/** 
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @notice Registers usernames as ENS subnodes of the domain `ensNode`
 */
contract UsernameRegistrar is Controlled, ApproveAndCallFallBack {
    
    ERC20Token public token;
    ENS public ensRegistry;
    PublicResolver public resolver;
    address public parentRegistry;

    uint256 public releaseDelay = 365 days;
    mapping (bytes32 => Account) public accounts;
    
    //slashing conditions
    uint256 public usernameMinLenght;
    bytes32 public reservedUsernamesMerkleRoot;
    
    event RegistryPrice(uint256 price);
    event RegistryMoved(address newRegistry);
    event UsernameOwner(bytes32 indexed nameHash, address owner);

    enum RegistrarState { Unactive, Active, Moved }
    bytes32 public ensNode;
    uint256 public price;
    RegistrarState public state;
    uint256 private reserveAmount;

    struct Account {
        uint256 balance;
        uint256 creationTime;
        address owner;
    }

    modifier onlyParentRegistry {
        require(msg.sender == parentRegistry, "Migration only.");
        _;
    }

    /** 
     * @notice Initializes a UserRegistry contract 
     * @param _token fee token base 
     * @param _ensRegistry Ethereum Name Service root address 
     * @param _resolver Default resolver to use in initial settings
     * @param _ensNode ENS node (registry) being used for usernames subnodes (subregistry)
     * @param _usernameMinLenght Minimum length of usernames 
     * @param _reservedUsernamesMerkleRoot Merkle Roots of reserved usernames 
     * @param _parentRegistry Address of old registry (if any) for account migration.
     */
    constructor(
        ERC20Token _token,
        ENS _ensRegistry,
        PublicResolver _resolver,
        bytes32 _ensNode,
        uint256 _usernameMinLenght,
        bytes32 _reservedUsernamesMerkleRoot,
        address _parentRegistry
    ) 
        public 
    {
        token = _token;
        ensRegistry = _ensRegistry;
        resolver = _resolver;
        ensNode = _ensNode;
        usernameMinLenght = _usernameMinLenght;
        reservedUsernamesMerkleRoot = _reservedUsernamesMerkleRoot;
        parentRegistry = _parentRegistry;
    }

    /**
     * @notice Registers `_label` username to `ensNode` setting msg.sender as owner.
     * Terms of name registration:
     * - SNT is deposited, not spent; the amount is locked up for 1 year.
     * - After 1 year, the user can release the name and receive their deposit back (at any time).
     * - User deposits are completely protected. The contract controller cannot access them.
     * - User's address(es) will be publicly associated with the ENS name.
     * - User must authorise the contract to transfer `price` `token.name()`  on their behalf.
     * - Usernames registered with less then `usernameMinLenght` characters can be slashed.
     * - Usernames contained in the merkle tree of root `reservedUsernamesMerkleRoot` can be slashed.
     * - Usernames starting with `0x` and bigger then 12 characters can be slashed.
     * - If terms of the contract change—e.g. Status makes contract upgrades—the user has the right to release the username and get their deposit back.
     * @param _label choosen unowned username hash 
     * @param _account optional address to set at public resolver
     * @param _pubkeyA optional pubkey part A to set at public resolver
     * @param _pubkeyB optional pubkey part B to set at public resolver
     */
    function register(
        bytes32 _label,
        address _account,
        bytes32 _pubkeyA,
        bytes32 _pubkeyB
    ) 
        external 
        returns(bytes32 namehash) 
    {
        return registerUser(msg.sender, _label, _account, _pubkeyA, _pubkeyB);
    }
    
    /** 
     * @notice release username and retrieve locked fee, needs to be called after `releasePeriod` from creation time.
     * @param _label `msg.sender` owned username hash 
     */
    function release(
        bytes32 _label
    )
        external 
    {
        bool isRegistryController = ensRegistry.owner(ensNode) == address(this);
        bytes32 namehash = keccak256(abi.encodePacked(ensNode, _label));
        Account memory account = accounts[_label];
        require(account.creationTime > 0, "Username not registered.");
        if (isRegistryController) {
            require(msg.sender == ensRegistry.owner(namehash), "Not owner of ENS node.");
            require(block.timestamp > account.creationTime + releaseDelay, "Release period not reached.");
            ensRegistry.setSubnodeOwner(ensNode, _label, address(this));
            ensRegistry.setResolver(namehash, address(0));
            ensRegistry.setOwner(namehash, address(0));
        } else {
            require(msg.sender == account.owner, "Not the former account owner.");
        }
        delete accounts[_label];
        if (account.balance > 0) {
            reserveAmount -= account.balance;
            require(token.transfer(msg.sender, account.balance), "Transfer failed");
        }
        emit UsernameOwner(_label, address(0));   
    }

    /** 
     * @notice updates funds owner, useful to move username account to new registry.
     * @param _label `msg.sender` owned username hash 
     **/
    function updateAccountOwner(
        bytes32 _label
    ) 
        external 
    {
        bytes32 namehash = keccak256(abi.encodePacked(ensNode, _label));
        require(msg.sender == ensRegistry.owner(namehash), "Caller not owner of ENS node.");
        require(accounts[_label].creationTime > 0, "Username not registered.");
        require(ensRegistry.owner(ensNode) == address(this), "Registry not owner of registry.");
        accounts[_label].owner = msg.sender;
        emit UsernameOwner(namehash, msg.sender);
    }  
    
    /**
     * @notice slash account due too length restriction 
     * @param _username raw value of offending username
     */
    function slashSmallUsername(
        bytes _username
    ) 
        external 
    {
        require(_username.length < usernameMinLenght, "Not a small username.");
        slashUsername(_username);
    }

    /**
     * @notice slash account due look like an address 
     * @param _username raw value of offending username
     */
    function slashAddressLikeUsername(
        string _username
    ) 
        external 
    {
        bytes memory username = bytes(_username);
        require(username.length > 12, "Too small to look like an address.");
        require(username[0] == byte("0"), "First character need to be 0");
        require(username[1] == byte("x"), "Second character need to be x");
        slashUsername(username);
    }  

    /**
     * @notice slash account due reserved name
     * @param _username raw value of offending username
     */
    function slashReservedUsername(
        bytes _username,
        bytes32[] _proof
    ) 
        external 
    {   
        require(
            MerkleProof.verifyProof(
                _proof,
                reservedUsernamesMerkleRoot,
                keccak256(_username)
            ),
            "Invalid Proof."
        );
        slashUsername(_username);
    }

    /**
     * @notice slash account of invalid username
     * @param _username raw value of offending username
     * @param _offendingPos position of invalid character
     */
    function slashInvalidUsername(
        bytes _username,
        uint256 _offendingPos
    ) 
        external
    { 
        require(_username.length > _offendingPos, "Invalid position.");
        byte b = _username[_offendingPos];
        
        require(!((b >= 48 && b <= 57) || (b >= 97 && b <= 122)), "Not invalid character.");
    
        slashUsername(_username);
    }

    /**
     * @notice Migrate account to new registry
     * @param _label `msg.sender` owned username hash 
     **/
    function moveAccount(
        bytes32 _label
    ) 
        external 
    {
        require(msg.sender == accounts[_label].owner, "Callable only by account owner.");
        UsernameRegistrar _newRegistry = UsernameRegistrar(ensRegistry.owner(ensNode));
        Account memory account = accounts[_label];
        delete accounts[_label];

        token.approve(_newRegistry, account.balance);
        _newRegistry.migrateUsername(
            _label,
            account.balance,
            account.creationTime,
            account.owner
        );
    }
    
    /**
     * @dev callabe only by parent registry to continue migration of ENSSubdomainRegistry
     * @param _domainHash needs to be this contract ensNode
     **/
    function migrateDomain(
        uint256 _price,
        bytes32 _domainHash
    ) 
        external
        onlyParentRegistry
    {
        require(_domainHash == ensNode, "Wrong Registry");
        migrateRegistry(_price);
    }

    /** 
     * @notice Activate registry
     * @param _price The price of username registry
     */
    function activate(
        uint256 _price
    ) 
        external
        onlyController
    {
        require(state == RegistrarState.Unactive, "Registry state is not unactive");
        require(ensRegistry.owner(ensNode) == address(this), "Registry does not own registry");
        price = _price;
        state = RegistrarState.Active;
        emit RegistryPrice(_price);
    }

    /** 
     * @notice updates default public resolver for newly registred usernames
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

    /**
     * @notice updates registry price
     * @param _price new price
     */
    function updateRegistryPrice(
        uint256 _price
    ) 
        external
        onlyController
    {
        require(state == RegistrarState.Active, "Registry not owned");
        price = _price;
        emit RegistryPrice(_price);
    }
  
    /**
     * @notice moves a registry to other Registry (will not move usernames accounts)
     * @param _newRegistry new registry hodling this registry
     */
    function moveRegistry(
        UsernameRegistrar _newRegistry
    ) 
        external
        onlyController
    {
        require(state == RegistrarState.Active, "Wrong registry");
        require(ensRegistry.owner(ensNode) == address(this), "Registry not owned anymore.");
        state = RegistrarState.Moved;
        ensRegistry.setOwner(ensNode, _newRegistry);
        _newRegistry.migrateRegistry(price);
        emit RegistryMoved(_newRegistry);
    }

    /**
     * @dev callable only by parent registry for continue user opt-in migration
     * @param _domainHash needs to be this contract ensNode
     **/
    function migrateAccount(
        bytes32 _userHash,
        bytes32 _domainHash,
        uint256 _tokenBalance,
        uint256 _creationTime,
        address _accountOwner
    )
        external
    {
        require(_domainHash == ensNode, "Wrong Registry");
        migrateUsername(_userHash, _tokenBalance, _creationTime, _accountOwner);
    }

    /**
     * @notice withdraw tokens forced into the contract
     * @param _token address of ERC20 withdrawing excess, or address(0) if want ETH/
     * @param _beneficiary who gets the funds
     **/
    function withdrawExcessBalance(
        address _token,
        address _beneficiary
    )
        external 
        onlyController 
    {
        require(_beneficiary != address(0), "Cannot burn token");
        if (_token == address(0)) {
            _beneficiary.transfer(address(this).balance);
        } else {
            ERC20Token excessToken = ERC20Token(_token);
            uint256 amount = excessToken.balanceOf(address(this));
            if(_token == address(token)){
                require(amount > reserveAmount, "Is not excess");
                amount -= reserveAmount;
            } else {
                require(amount > 0, "Is not excess");
            }
            excessToken.transfer(_beneficiary, amount);
        }
    }

    /**
     * @notice withdraw ens nodes not belonging to this contract
     * @param _domainHash ens node namehash
     * @param _beneficiary new owner of ens node
     **/
    function withdrawWrongNode(
        bytes32 _domainHash,
        address _beneficiary
    ) 
        external
        onlyController
    {
        require(_beneficiary != address(0), "Cannot burn node");
        require(_domainHash != ensNode, "Cannot withdraw main node");   
        require(ensRegistry.owner(_domainHash) == address(this), "Not owner of this node");   
        ensRegistry.setOwner(_domainHash, _beneficiary);
    }

    /**
     * @notice gets registrar price 
     * @return registry price
     **/
    function getPrice() 
        external 
        view 
        returns(uint256 registryPrice) 
    {
        return price;
    }
    
    /**
     * @notice reads amount tokens locked in username 
     * @param _label hash of username
     * @return locked username balance
     **/
    function getAccountBalance(bytes32 _label)
        external
        view
        returns(uint256 accountBalance) 
    {
        accountBalance = accounts[_label].balance;
    }

    /**
     * @notice reads username owner at this contract, 
     * which can release or migrate in case of upgrade
     * @param _label hash of username
     * @return username owner
     **/
    function getAccountOwner(bytes32 _label)
        external
        view
        returns(address owner) 
    {
        owner = accounts[_label].owner;
    }

    /**
     * @notice reads when the account was registered 
     * @param _label hash of username
     * @return registration time
     **/
    function getCreationTime(bytes32 _label)
        external
        view
        returns(uint256 creationTime) 
    {
        creationTime = accounts[_label].creationTime;
    }

    /**
     * @notice calculate time where username can be released 
     * @param _label hash of username
     * @return exact time when username can be released
     **/
    function getExpirationTime(bytes32 _label)
        external
        view
        returns(uint256 expirationTime)
    {
        expirationTime = accounts[_label].creationTime + releaseDelay;
    }

    /**
     * @notice Receive approval, callable only by `token()`. 
     * @param _from who is approving
     * @param _amount amount being approved, need to be equal `getPrice()`
     * @param _token token being approved, need to be equal `token()`
     * @param _data abi encoded data with selector of `register(bytes32,address,bytes32,bytes32)`
     */
    function receiveApproval(
        address _from,
        uint256 _amount,
        address _token,
        bytes _data
    ) 
        public
    {
        require(_amount == price, "Wrong value");
        require(_token == address(token), "Wrong token");
        require(_token == address(msg.sender), "Wrong call");
        require(_data.length <= 132, "Wrong data length");
        bytes4 sig;
        bytes32 label;
        address account;
        bytes32 pubkeyA;
        bytes32 pubkeyB;
        (sig, label, account, pubkeyA, pubkeyB) = abiDecodeRegister(_data);
        require(
            sig == bytes4(0xb82fedbb), //bytes4(keccak256("register(bytes32,address,bytes32,bytes32)"))
            "Wrong method selector"
        );
        registerUser(_from, label, account, pubkeyA, pubkeyB);
    }
    
    /**
     * @dev decodes abi encoded data with selector for "register(bytes32,address,bytes32,bytes32)"
     * @param _data abi encoded data
     */
    function abiDecodeRegister(
        bytes _data
    ) 
        private 
        pure 
        returns(
            bytes4 sig,
            bytes32 label,
            address account,
            bytes32 pubkeyA,
            bytes32 pubkeyB
        )
    {
        assembly {
            sig := mload(add(_data, add(0x20, 0)))
            label := mload(add(_data, 36))
            account := mload(add(_data, 68))
            pubkeyA := mload(add(_data, 100))
            pubkeyB := mload(add(_data, 132))
        }
    }
    /**
     * @dev callable only by parent registry for continue user opt-in migration
     * @param _label any username hash coming from parent
     * @param _tokenBalance amount being transferred
     * @param _creationTime any value coming from parent
     * @param _accountOwner owner for opt-out/release at registry move
     **/
    function migrateUsername(
        bytes32 _label,
        uint256 _tokenBalance,
        uint256 _creationTime,
        address _accountOwner
    )
        public
        onlyParentRegistry
    {
        if (_tokenBalance > 0) {
            require(
                token.transferFrom(
                    parentRegistry,
                    address(this),
                    _tokenBalance
                ), 
                "Error moving funds from old registar."
            );
            reserveAmount += _tokenBalance;
        }
        accounts[_label] = Account(_tokenBalance, _creationTime, _accountOwner);
    }

    /**
     * @dev callabe only by parent registry to continue migration
     * of registry and activate registrar
     * @param _price the price to setup and activate domain
     **/
    function migrateRegistry(
        uint256 _price
    ) 
        public
        onlyParentRegistry
    {
        require(state == RegistrarState.Unactive, "Not unactive");
        require(ensRegistry.owner(ensNode) == address(this), "ENS registry owner not transfered.");
        price = _price;
        state = RegistrarState.Active;
        emit RegistryPrice(_price);
    }

    /**
     * @notice Registers `_label` username to `ensNode` setting msg.sender as owner.
     * @param _owner address registering the user and paying registry price.
     * @param _label choosen unowned username hash 
     * @param _account optional address to set at public resolver
     * @param _pubkeyA optional pubkey part A to set at public resolver
     * @param _pubkeyB optional pubkey part B to set at public resolver
     */
    function registerUser(
        address _owner,
        bytes32 _label,
        address _account,
        bytes32 _pubkeyA,
        bytes32 _pubkeyB
    ) 
        internal 
        returns(bytes32 namehash)
    {
        require(state == RegistrarState.Active, "Registry unavailable.");
        namehash = keccak256(abi.encodePacked(ensNode, _label));
        require(ensRegistry.owner(namehash) == address(0), "ENS node already owned.");
        require(accounts[_label].creationTime == 0, "Username already registered.");
        accounts[_label] = Account(price, block.timestamp, _owner);
        if(price > 0) {
            require(token.allowance(_owner, address(this)) >= price, "Unallowed to spend.");
            require(
                token.transferFrom(
                    _owner,
                    address(this),
                    price
                ),
                "Transfer failed"
            );
            reserveAmount += price;
        } 
    
        bool resolvePubkey = _pubkeyA != 0 || _pubkeyB != 0;
        bool resolveAccount = _account != address(0);
        if (resolvePubkey || resolveAccount) {
            //set to self the ownship to setup initial resolver
            ensRegistry.setSubnodeOwner(ensNode, _label, address(this));
            ensRegistry.setResolver(namehash, resolver); //default resolver
            if (resolveAccount) {
                resolver.setAddr(namehash, _account);
            }
            if (resolvePubkey) {
                resolver.setPubkey(namehash, _pubkeyA, _pubkeyB);
            }
            ensRegistry.setOwner(namehash, _owner);
        } else {
            //transfer ownship of subdone directly to registrant
            ensRegistry.setSubnodeOwner(ensNode, _label, _owner);
        }
        emit UsernameOwner(namehash, _owner);
    }
    
    /**
     * @dev removes account hash of `_username` and send account.balance to msg.sender
     * @param _username username being slashed
     */
    function slashUsername(bytes _username) internal {
        bytes32 label = keccak256(_username);
        bytes32 namehash = keccak256(abi.encodePacked(ensNode, label));
        require(accounts[label].creationTime > 0, "Username not registered.");
        
        ensRegistry.setSubnodeOwner(ensNode, label, address(this));
        ensRegistry.setResolver(namehash, address(0));
        ensRegistry.setOwner(namehash, address(0));
        
        uint256 amountToTransfer = accounts[label].balance;
        delete accounts[label];
        if (amountToTransfer > 0) {
            reserveAmount -= amountToTransfer;
            require(token.transfer(msg.sender, amountToTransfer), "Error in transfer.");   
        }
        emit UsernameOwner(namehash, address(0));
    }
    
}
