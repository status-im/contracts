pragma solidity >=0.5.0 <0.6.0;

import "./StickerPack.sol";
import "../../token/ERC20Token.sol";
import "../../token/ApproveAndCallFallBack.sol";
import "../../common/Controlled.sol";

/**
 * StickerMarket allows any address register "StickerPack" which can be sold to any address in form of "StickerPack", an ERC721 token.
 */
contract StickerMarket is Controlled, StickerPack, ApproveAndCallFallBack {
    event Register(uint256 indexed marketId, uint256 dataPrice, bytes _contenthash);
    event Unregister(uint256 indexed marketId);
    event ClaimedTokens(address indexed _token, address indexed _controller, uint256 _amount);
    event MarketState(bool enabled);

    struct Pack {
        bytes contenthash;
        uint256 price; //in "wei"
        address owner; //beneficiary of "buy"
    }

    bool public marketEnabled; //market state
    ERC20Token public snt; //payment token
    mapping(uint256 => Pack) public marketPacks;
    

    uint256 public marketCount; //total amount of market registrations

    uint256[] private _availablePacks; //array of available packs
    mapping (uint256 => uint256) private _availablePacksPos; //position on array of available packs
    mapping(bytes32 => bool) private registered;
    /**
     * @dev can only be called when market is open
     */
    modifier market {
        require(marketEnabled, "Market Disabled");
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
     * @notice buy a pack from market pack owner, including a StickerPack's token in msg.sender account with same metadata of `_marketId` 
     * @param _marketId id of market pack 
     * @return tokenId generated StickerPack token 
     */
    function buyStickerPackToken(uint256 _marketId) external market returns (uint256 tokenId) {
        return _buy(msg.sender, _marketId);
    }

    /** 
     * @dev emits StickerMarket.Register(`marketId`, `_urlHash`, `_price`, `_contenthash`)
     * @notice Registers to sell a sticker pack 
     * @param _price cost in wei to users minting with _urlHash metadata
     * @param _owner address of the beneficiary of buys
     * @param _contenthash EIP1577 pack contenthash for listings
     * @return marketId Market position of Sticker Pack data.
     */
    function registerMarketPack(uint256 _price, address _owner, bytes calldata _contenthash) external market returns(uint256 marketId) {
        bytes32 _urlHash = keccak256(_contenthash);
        require(!registered[_urlHash], "Duplicated");
        registered[_urlHash] = true;
        marketId = marketCount++;
        marketPacks[marketId] = Pack(_contenthash, _price, _owner);
        addAvailablePack(marketId);
        emit Register(marketId, _price, _contenthash);
    }

    /**
     * @notice changes beneficiary of `_marketId`, can only be called when market is open
     * @param _marketId which market position is being transfered
     * @param _to new beneficiary
     */
    function transferMarketPack(uint256 _marketId, address _to) external market {
        require(marketPacks[_marketId].owner == msg.sender);
        marketPacks[_marketId].owner = _to;
    }

    /**
     * @notice changes price of `_marketId`, can only be called when market is open
     * @param _marketId which market position is being transfered
     * @param _value new value
     */
    function setPriceMarketPack(uint256 _marketId, uint256 _value) external market {
        require(marketPacks[_marketId].owner == msg.sender);
        marketPacks[_marketId].price = _value;
    }
    
    /**
     * @notice removes all market data about a marketed pack, can only be called by listing owner or market controller, and when market is open
     * @param _marketId position to be deleted
     */
    function unregisterMarketPack(uint256 _marketId) external market {
        require(msg.sender == controller || msg.sender == marketPacks[_marketId].owner, "Unauthorized");
        delete marketPacks[_marketId];
        removeAvailablePack(_marketId);
        emit Unregister(_marketId);
    }

    /**
     * @dev Mints NFT StickerPack in `msg.sender` account, and Transfers SNT using user allowance
     * emit NonfungibleToken.Transfer(`address(0)`, `msg.sender`, `tokenId`)
     * @notice MiniMeToken ApproveAndCallFallBack support for buyStickerPackToken, can only be called by SNT contract and when market is open
     * @param _from account calling "approve and buy" 
     * @param _amount must be exactly equal cost of select pack
     * @param _token must be exactly SNT contract
     * @param _data abi encoded call for buyStickerPackToken(uint256)
     */
    function receiveApproval(address _from, uint256, address _token, bytes calldata _data) external market {
        require(_token == address(snt), "Bad token");
        require(_token == address(msg.sender), "Bad call");
        require(_data.length == 36, "Bad data length");
        uint256 marketId = abiDecodeBuyStickerPackToken(_data);
        _buy(_from, marketId);
    }

    /**
     * @notice changes market state, only controller can call.
     * @param enabled true for market open, false for closed.
     */
    function setMarketState(bool enabled) external onlyController {
        marketEnabled = enabled;
        emit MarketState(enabled);
    }

    /**
     * @notice This method can be used by the controller to extract mistakenly
     *  sent tokens to this contract.
     * @param _token The address of the token contract that you want to recover
     *  set to 0 in case you want to extract ether.
     */
    function claimTokens(address _token) external onlyController {
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
     * @notice read market data
     * @param _marketId position of query
     * @return all data about listing
     */
    function getMarketPackData(uint256 _marketId) external view returns(uint256 price, address owner, bytes memory contenthash){
        Pack memory packData = marketPacks[_marketId];
        price = packData.price;
        owner = packData.owner;
        contenthash = packData.contenthash;
    }

    /**
     * @notice read market pack price
     * @param _marketId position of query
     * @return 
     */
    function marketPriceOf(uint256 _marketId) external view returns(uint256 price){
        price = marketPacks[_marketId].price;
    }

    /**
     * @notice read market pack beneficary
     * @param _marketId position of query
     * @return beneficairy of buys
     */
    function marketPackOwner(uint256 _marketId) external view returns(address owner){
        owner = marketPacks[_marketId].owner;
    }

    /**
     * @notice read available market ids
     * @return array of market id registered
     */
    function getAvailablePacks() external view returns (uint256[] memory availableIds) {
        return _availablePacks;
    }

    /**
     * @notice read token metadata,
     * @param _tokenId token being queried
     * @return EIP1577 pack contenthash , can be empty if listing was removed.
     */
    function getUserPackData(uint256 _tokenId) external view returns(bytes memory contenthash){
        contenthash = marketPacks[tokenMarketId[_tokenId]].contenthash;
    }

    /** 
     * @dev transfer SNT from buyer to pack owner and mint sticker pack token 
     */
    function _buy(address _buyer, uint256 _marketId) internal returns (uint256 tokenId){
        Pack memory _pack = marketPacks[_marketId];
        require(_pack.owner != address(0), "Bad pack");
        require(snt.allowance(_buyer, address(this)) >= _pack.price, "Bad argument");
        if(_pack.price > 0){
            require(snt.transferFrom(_buyer, _pack.owner, _pack.price), "Bad payment");
        }
        return generateStickerPackToken(_buyer, _marketId);
    }

    /** 
     * @dev adds id from "available list" 
     */
    function addAvailablePack(uint256 _marketId) internal {
        _availablePacksPos[_marketId] = _availablePacks.push(_marketId) + 1;
    }
    
    /** 
     * @dev remove id from "available list" 
     */
    function removeAvailablePack(uint256 _marketId) internal {
        uint pos = _availablePacksPos[_marketId];
        if(pos == 0) {
            return;
        }
        uint256 movedElement = _availablePacks[_availablePacks.length-1]; //tokenId;
        _availablePacks[pos-1] = movedElement;
        _availablePacks.length--;
        _availablePacksPos[movedElement] = pos;
    }

    /**
     * @dev Decodes abi encoded data with selector for "buyStickerPackToken(uint256)".
     * @param _data Abi encoded data.
     * @return Decoded registry call.
     */
    function abiDecodeBuyStickerPackToken(
        bytes memory _data
    ) 
        private 
        pure 
        returns(
            uint256 packId
        )
    {
        bytes4 sig;
        assembly {
            sig := mload(add(_data, add(0x20, 0)))
            packId := mload(add(_data, 36))
        }
        require(sig == bytes4(keccak256("buyStickerPackToken(uint256)")), "Bad method sig");
    }
}