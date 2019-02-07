pragma solidity >=0.5.0 <0.6.0;

import "../../token/NonfungibleToken.sol";
import "../../token/ERC20Token.sol";
import "../../token/ApproveAndCallFallBack.sol";
import "../../common/Controlled.sol";

/**
 * StickerMarket allows any address register "StickerPack" which can be sold to any address in form of "StickerPack", an ERC721 token.
 */
contract StickerMarket is Controlled, NonfungibleToken, ApproveAndCallFallBack {
    event Register(uint256 indexed packId, uint256 dataPrice, bytes _contenthash);
    event Categorized(bytes4 indexed category, uint256 indexed packId);
    event Uncategorized(bytes4 indexed category, uint256 indexed packId);
    event Unregister(uint256 indexed packId);
    event ClaimedTokens(address indexed _token, address indexed _controller, uint256 _amount);
    event MarketState(State state);
    event RegisterFee(uint256 value);
    event BurnRate(uint256 value);

    enum State { Invalid, Open, BuyOnly, Controlled, Closed }

    struct Pack {
        bytes4[] category;
        address owner; //beneficiary of "buy"
        bool mintable; 
        uint256 timestamp;
        uint256 price; //in "wei"
        uint256 donate; //in "wei"
        bytes contenthash;
    }

    State public state = State.Open;
    uint256 registerFee;
    uint256 burnRate;
    
    //include global var to set burn rate/percentage
    ERC20Token public snt; //payment token
    mapping(uint256 => Pack) public packs;
    mapping(uint256 => uint256) public tokenPackId; //packId
    uint256 public packCount; //pack registers
    uint256 public tokenCount; //tokens buys  

    //auxilary views
    mapping(bytes4 => uint256[]) private availablePacks; //array of available packs
    mapping(bytes4 => mapping(uint256 => uint256)) private availablePacksIndex; //position on array of available packs
    mapping(uint256 => mapping(bytes4 => uint256)) private packCategoryIndex;
    /**
     * @dev can only be called when market is open
     */
    modifier marketManagement {
        require(state == State.Open || (msg.sender == controller && state == State.Controlled), "Market Disabled");
        _;
    }

    /**
     * @dev can only be called when market is open
     */
    modifier marketSell {
        require(state == State.Open || state == State.BuyOnly || (msg.sender == controller && state == State.Controlled), "Market Disabled");
        _;
    }

    modifier packOwner(uint256 _packId) {
        require(msg.sender == controller || packs[_packId].owner == msg.sender);
        _;
    }

    /**
     * @param _snt SNT token
     */
    constructor(
        ERC20Token _snt
    ) 
        public
    { 
        snt = _snt;
    }

    /** 
     * @dev Mints NFT StickerPack in `msg.sender` account, and Transfers SNT using user allowance
     * emit NonfungibleToken.Transfer(`address(0)`, `msg.sender`, `tokenId`)
     * @notice buy a pack from market pack owner, including a StickerPack's token in msg.sender account with same metadata of `_packId` 
     * @param _packId id of market pack 
     * @param _destination owner of token being brought
     * @return tokenId generated StickerPack token 
     */
    function buyToken(
        uint256 _packId,
        address _destination
    ) 
        external  
        returns (uint256 tokenId)
    {
        return buy(msg.sender, _packId, _destination);
    }

    /** 
     * @dev emits StickerMarket.Register(`packId`, `_urlHash`, `_price`, `_contenthash`)
     * @notice Registers to sell a sticker pack 
     * @param _price cost in wei to users minting with _urlHash metadata
     * @param _donate optional amount of `_price` that is donated to StickerMarket at every buy
     * @param _category listing category
     * @param _owner address of the beneficiary of buys
     * @param _contenthash EIP1577 pack contenthash for listings
     * @return packId Market position of Sticker Pack data.
     */
    function registerPack(
        uint256 _price,
        uint256 _donate,
        bytes4[] calldata _category, 
        address _owner,
        bytes calldata _contenthash
    ) 
        external  
        returns(uint256 packId)
    {
        packId = register(msg.sender, _category, _owner, _price, _donate, _contenthash);
    }

    /**
     * @notice changes beneficiary of `_packId`, can only be called when market is open
     * @param _packId which market position is being transfered
     * @param _to new beneficiary
     */
    function setPackOwner(uint256 _packId, address _to) 
        external 
        marketManagement 
        packOwner(_packId)
    {
        packs[_packId].owner = _to;
    }

    /**
     * @notice changes price of `_packId`, can only be called when market is open
     * @param _packId which market position is being transfered
     * @param _price new value
     */
    function setPackPrice(uint256 _packId, uint256 _price, uint256 _donate) 
        external 
        marketManagement 
        packOwner(_packId)
    {
        require(_donate <= 10000, "Bad argument, _donate cannot be more then 100.00%");
        packs[_packId].price = _price;
        packs[_packId].donate = _donate;
    }

    /**
     * @notice changes caregory of `_packId`, can only be called when market is open
     * @param _packId which market position is being transfered
     * @param _category new category
     */

    function addPackCategory(uint256 _packId, bytes4 _category)
        external 
        marketManagement 
        packOwner(_packId)
    {
        addAvailablePack(_packId, _category);
    }

    /**
     * @notice changes caregory of `_packId`, can only be called when market is open
     * @param _packId which market position is being transfered
     * @param _category category to unlist
     */

    function removePackCategory(uint256 _packId, bytes4 _category)
        external 
        marketManagement 
        packOwner(_packId)
    {
        removeAvailablePack(_packId, _category);
    }
    
    /**
     * @notice 
     * @param _packId position edit
     */
    function setPackState(uint256 _packId, bool _mintable) 
        external 
        marketManagement 
        packOwner(_packId)
    {
        packs[_packId].mintable = _mintable;
    }

    /**
     * @notice MiniMeToken ApproveAndCallFallBack forwarder for registerPack and buyToken
     * @param _from account calling "approve and buy" 
     * @param _token must be exactly SNT contract
     * @param _data abi encoded call 
     */
    function receiveApproval(
        address _from,
        uint256,
        address _token,
        bytes calldata _data
    ) 
        external 
    {
        require(_token == address(snt), "Bad token");
        require(_token == address(msg.sender), "Bad call");

        if(msg.sig == bytes4(keccak256("buyToken(uint256,address)"))){
            require(_data.length == 56, "Bad data length");
            (uint256 packId, address owner) = abi.decode(msg.data, (uint256, address));
            buy(_from, packId, owner);
        } else if(msg.sig == bytes4(keccak256("registerPack(uint256,uint256,bytes4,address,bytes)"))) {
            require(_data.length > 60, "Bad data length");
            (uint256 _price, uint256 _donate, bytes4[] memory _category, address _owner, bytes memory _contenthash) = abi.decode(msg.data, (uint256,uint256,bytes4[],address,bytes));
            register(_from, _category, _owner, _price, _donate, _contenthash);
        } else {
            revert("Bad call");
        }
    }

    /**
     * @notice removes all market data about a marketed pack, can only be called by listing owner or market controller, and when market is open
     * @param _packId position to be deleted
     */
    function purgePack(uint256 _packId, uint256 _limit)
        external
        onlyController 
    {
        bytes4[] memory _category = packs[_packId].category;
        uint limit;
        if(_limit == 0) {
            limit = _category.length;
        } else {
            require(_limit <= _category.length, "Bad limit");
            limit = _limit;
        }
        
        uint256 len = _category.length;
        if(len > 0){
            len--;
        }
        for(uint i = 0; i < limit; i++){
            removeAvailablePack(_packId, _category[len-i]);
        }

        if(packs[_packId].category.length == 0){
            delete packs[_packId];
            emit Unregister(_packId);
        }
        
    }

    /**
     * @notice changes market state, only controller can call.
     * @param _state new state
     */
    function setMarketState(State _state)
        external
        onlyController 
    {
        state = _state;
        emit MarketState(_state);
    }

    /**
     * @notice changes register fee, only controller can call.
     * @param _value new register fee
     */
    function setRegisterFee(uint256 _value)
        external
        onlyController 
    {
        registerFee = _value;
        emit RegisterFee(_value);
    }

        /**
     * @notice changes burn rate, only controller can call.
     * @param _value new burn rate
     */
    function setBurnRate(uint256 _value)
        external
        onlyController 
    {
        burnRate = _value;
        emit BurnRate(_value);
    }

    /**
     * @notice controller can generate tokens at will
     * @param _owner account being included new token
     * @param _packId pack being minted
     * @return tokenId created
     */
    function generateToken(address _owner, uint256 _packId) 
        external
        onlyController 
        returns (uint256 tokenId)
    {
        return mintStickerPack(_owner, _packId);
    }

    /**
     * @notice This method can be used by the controller to extract mistakenly
     *  sent tokens to this contract.
     * @param _token The address of the token contract that you want to recover
     *  set to 0 in case you want to extract ether.
     */
    function claimTokens(address _token) 
        external
        onlyController 
    {
        if (_token == address(0)) {
            address(controller).transfer(address(this).balance);
            return;
        }
        ERC20Token token = ERC20Token(_token);
        uint256 balance = token.balanceOf(address(this));
        token.transfer(controller, balance);
        emit ClaimedTokens(_token, controller, balance);
    }
    
    /**
     * @notice read available market ids in a category (might be slow)
     * @return array of market id registered
     */
    function getAvailablePacks(bytes4 _category) 
        external 
        view 
        returns (uint256[] memory availableIds)
    {
        return availablePacks[_category];
    }

    /**
     * @notice count total packs in a category
     * @return lenght
     */
    function getCategoryLength(bytes4 _category) 
        external 
        view 
        returns (uint256 size)
    {
        size = availablePacks[_category].length;
    }

    /**
     * @notice read packId of a category index
     * @return packId
     */
    function getCategoryPack(bytes4 _category, uint256 _index) 
        external 
        view 
        returns (uint256 packId)
    {
        packId = availablePacks[_category][_index];
    }
    
    /**
     * @notice returns all data from pack in market
     */
    function getPackData(uint256 _packId) 
        external 
        view 
        returns (
            bytes4[] memory category,
            address owner,
            bool mintable,
            uint256 timestamp,
            uint256 price,
            bytes memory contenthash
        ) 
    {
        Pack memory pack = packs[_packId];
        return (
            pack.category,
            pack.owner,
            pack.mintable,
            pack.timestamp,
            pack.price,
            pack.contenthash
        );
    }

    /**
     * @notice returns relevant token data
     */
    function getTokenData(uint256 _tokenId) 
        external 
        view 
        returns (
            bytes4[] memory category,
            uint256 timestamp,
            bytes memory contenthash
        ) 
    {
        Pack memory pack = getTokenPack(_tokenId);
        return (
            pack.category,
            pack.timestamp,
            pack.contenthash
        );
    }

    /** 
     * @dev register new pack to owner
     */
    function register(
        address _caller,
        bytes4[] memory _category,
        address _owner,
        uint256 _price,
        uint256 _donate,
        bytes memory _contenthash
    ) 
        internal 
        marketManagement
        returns(uint256 packId) 
    {
        if(registerFee > 0){
            require(snt.transferFrom(_caller, address(this), registerFee), "Bad payment");
        }
        require(_donate <= 10000, "Bad argument, _donate cannot be more then 100.00%");
        packId = packCount++;
        packs[packId] = Pack(new bytes4[](0), _owner, true, block.timestamp, _price, _donate, _contenthash);
        for(uint i = 0;i < _category.length; i++){
            addAvailablePack(packId, _category[i]);
        }
        
        emit Register(packId, _price, _contenthash);
    }

    /** 
     * @dev transfer SNT from buyer to pack owner and mint sticker pack token 
     */
    function buy(
        address _caller,
        uint256 _packId,
        address _destination
    ) 
        internal 
        marketSell
        returns (uint256 tokenId)
    {
        Pack memory _pack = packs[_packId];
        require(_pack.owner != address(0), "Bad pack");
        require(_pack.mintable, "Disabled");
        require(_pack.price > 0, "Unauthorized");
      
        uint256 amount = _pack.price;
        
        if(burnRate > 0) {
            uint256 burned = (_pack.price * burnRate) / 10000;
            amount -= burned;
            require(snt.transferFrom(_caller, Controlled(address(snt)).controller(), burned), "Bad burn");
        }
        if(_pack.donate > 0) {
            uint256 donate = (_pack.price * _pack.donate) / 10000;
            amount -= donate;
            require(snt.transferFrom(_caller, address(this), donate), "Bad donate");
        } 
        if(amount > 0) {
            require(snt.transferFrom(_caller, _pack.owner, amount), "Bad payment");
        }
        return mintStickerPack(_destination, _packId);
    }
    
    /**
     * @dev creates new NFT
     */
    function mintStickerPack(
        address _owner,
        uint256 _packId
    )
        internal 
        returns (uint256 tokenId)
    {
        tokenId = tokenCount++;
        tokenPackId[tokenId] = _packId;
        mint(_owner, tokenId);
    }
    
    /** 
     * @dev adds id from "available list" 
     */
    function addAvailablePack(uint256 _packId, bytes4 _category) private {
        require(packCategoryIndex[_packId][_category] == 0, "Duplicate categorization");
        availablePacksIndex[_category][_packId] = availablePacks[_category].push(_packId);
        packCategoryIndex[_packId][_category] = packs[_packId].category.push(_category);
        emit Categorized(_category, _packId);
    }
    
    /** 
     * @dev remove id from "available list" 
     */
    function removeAvailablePack(uint256 _packId, bytes4 _category) private {
        uint pos = availablePacksIndex[_category][_packId];
        require(pos > 0, "Not categorized [1]");
        delete availablePacksIndex[_category][_packId];
        if(pos != availablePacks[_category].length){
            uint256 movedElement = availablePacks[_category][availablePacks[_category].length-1]; //tokenId;
            availablePacks[_category][pos-1] = movedElement;
            availablePacksIndex[_category][movedElement] = pos;
        }
        availablePacks[_category].length--;

        uint pos2 = packCategoryIndex[_packId][_category];
        require(pos2 > 0, "Not categorized [2]");
        delete packCategoryIndex[_packId][_category];
        if(pos2 != packs[_packId].category.length){
            bytes4 movedElement2 = packs[_packId].category[packs[_packId].category.length-1]; //tokenId;
            packs[_packId].category[pos2-1] = movedElement2;
            packCategoryIndex[_packId][movedElement2] = pos2;
        }
        packs[_packId].category.length--;
        emit Uncategorized(_category, _packId);

    }

    /**
     * @dev reads token pack data
     */
    function getTokenPack(uint256 _tokenId) private view returns(Pack memory pack){
        pack = packs[tokenPackId[_tokenId]];
    }

}