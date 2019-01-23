pragma solidity >=0.5.0 <0.6.0;

import "./StickerPack.sol";
import "../../token/ERC20Token.sol";
import "../../token/ApproveAndCallFallBack.sol";
import "../../common/Controlled.sol";

/**
 * 
 */
contract StickerMarket is Controlled, StickerPack, ApproveAndCallFallBack {
    event Register(uint256 indexed marketId, bytes32 indexed stickersMerkleRoot, uint256 dataPrice, bytes _contenthash);
    event Unregister(uint256 indexed marketId, bytes32 indexed stickersMerkleRoot);
    event ClaimedTokens(address indexed _token, address indexed _controller, uint256 _amount);
    event MarketState(bool enabled);

    struct Pack {
        bytes32 stickersMerkleRoot; // merkle tree root of "ipfs://stickerdata-json" leafs
        uint256 price;
        address owner;
    }
    ERC20Token public snt;    
    bool public marketEnabled;
    mapping(uint256 => Pack) public marketPacks;
    mapping(bytes32 => uint256) public marketIds;
    mapping(bytes32 => bytes) public packContenthash;

    uint256 public marketCount;

    uint256[] private _availablePacks;
    mapping (uint256 => uint256) private _availablePacksPos;

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

    function buyStickerPackToken(uint256 _marketId) external market returns (uint256 tokenId) {
        return _buy(msg.sender, marketPacks[_marketId]);
    }

    function receiveApproval(address _from, uint256 _amount, address _token, bytes calldata _data) external market {
        require(_token == address(snt), "Bad token");
        require(_token == address(msg.sender), "Bad call");
        require(_data.length == 36, "Bad data length");
        uint256 packId = abiDecodeBuyStickerPackToken(_data);
        Pack memory pack = marketPacks[packId];
        require(pack.price == _amount, "Bad amount");
        _buy(_from, pack);
    }

    function transferMarketPack(uint256 _marketId, address _to) external market {
        require(marketPacks[_marketId].owner == msg.sender);
        marketPacks[_marketId].owner = _to;
    }

    function setPriceMarketPack(uint256 _marketId, uint256 _value) external market {
        require(marketPacks[_marketId].owner == msg.sender);
        marketPacks[_marketId].price = _value;
    }

    function setMarketState(bool enabled) external onlyController {
        marketEnabled = enabled;
        emit MarketState(enabled);
    }

    function registerMarketPack(bytes32 _stickersMerkleRoot, uint256 _price, address _owner, bytes calldata _packContenthash) external onlyController returns(uint256 marketId) {
        require(marketPacks[marketIds[_stickersMerkleRoot]].stickersMerkleRoot != _stickersMerkleRoot, "Duplicated");
        marketId = marketCount++;
        marketPacks[marketId] = Pack(_stickersMerkleRoot, _price, _owner);
        marketIds[_stickersMerkleRoot] = marketId;
        packContenthash[_stickersMerkleRoot] = _packContenthash;
        addAvailablePack(marketId);
        emit Register(marketId, _stickersMerkleRoot, _price, _packContenthash);
    }


    function unregisterMarketPack(uint256 _marketId) external onlyController {
        bytes32 stickersMerkleRoot = marketPacks[_marketId].stickersMerkleRoot;
        delete marketIds[stickersMerkleRoot];
        delete marketPacks[_marketId];
        removeAvailablePack(_marketId);
        emit Unregister(_marketId, stickersMerkleRoot);
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

    function getMarketPackData(uint256 _marketId) external view returns(bytes32 stickersMerkleRoot, uint256 price, address owner, bytes memory contentHash){
        Pack memory packData = marketPacks[_marketId];
        stickersMerkleRoot = packData.stickersMerkleRoot;
        price = packData.price;
        owner = packData.owner;
        contentHash = packContenthash[stickersMerkleRoot];
    }

    function marketPriceOf(uint256 _marketId) external view returns(uint256 price){
        price = marketPacks[_marketId].price;
    }
    
    function marketPackOwner(uint256 _marketId) external view returns(address owner){
        owner = marketPacks[_marketId].owner;
    }

    function marketPackMerkleRoot(uint256 _marketId) external view returns(bytes32 stickersMerkleRoot){
        stickersMerkleRoot = marketPacks[_marketId].stickersMerkleRoot;
    }

    function getAvailablePacks() external view returns (uint256[] memory availableIds) {
        return _availablePacks;
    }

    function _buy(address _buyer, Pack memory _pack) internal returns (uint256 tokenId){
        require(_pack.stickersMerkleRoot != bytes32(0), "Bad pack");
        require(snt.allowance(_buyer, address(this)) >= _pack.price, "Bad argument");
        if(_pack.price > 0){
            require(snt.transferFrom(_buyer, _pack.owner, _pack.price), "Bad payment");
        }
        return generateStickerPackToken(_buyer, _pack.stickersMerkleRoot);
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

    function addAvailablePack(uint256 _marketId) internal {
        _availablePacksPos[_marketId] = _availablePacks.push(_marketId);
    }
    
    function removeAvailablePack(uint256 _marketId) internal {
        uint pos = _availablePacksPos[_marketId];
        uint256 movedElement = _availablePacks[_availablePacks.length-1]; //tokenId;
        _availablePacks[pos] = movedElement;
        _availablePacks.length--;
        _availablePacksPos[movedElement] = pos;
    }
}