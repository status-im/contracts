pragma solidity >=0.5.0 <0.6.0;

import "./StickerPack.sol";
import "../../token/ERC20Token.sol";
import "../../token/ApproveAndCallFallBack.sol";
import "../../common/Controlled.sol";

/**
 * @dev 
 */
contract StickerMarket is Controlled, ApproveAndCallFallBack {
    event Register(uint256 packId, bytes32 dataHash, uint256 dataPrice);
    event Unregister(uint256 packId);
    event ClaimedTokens(address indexed _token, address indexed _controller, uint256 _amount);

    struct Pack {
        bytes32 dataHash; // merkle tree root of "ipfs://stickerdata-json"
        uint256 price;
        address owner;
    }
    StickerPack public stickerPack = new StickerPack();
    ERC20Token public snt;    
    mapping(uint256 => Pack) public packs;
    uint256 public nextId;

    //TODO: add list of packs available
    /**
     * @notice Constructor
     * @param _owner Authority address
     * @param _snt SNT token
     */
    constructor(
        ERC20Token _snt,
        uint256 _registerPrice
    ) 
        public
    { 
        snt = _snt;
    }

    function buy(uint256 _packId) external {
        _buy(msg.sender, packs[_packId]);
    }
    
    function receiveApproval(address _from, uint256 _amount, address _token, bytes calldata _data) external {
        require(_token == address(snt), "Bad token");
        require(_token == address(msg.sender), "Bad call");
        require(_data.length == 36, "Bad data length");
        uint256 packId = abiDecodeBuy(_data);
        Pack memory pack = packs[packId];
        require(pack.price == _amount, "Bad amount");
        _buy(_from, pack);
    }

    function register(bytes32 _dataHash, uint256 _price, address _owner) external onlyController {
        uint256 id = nextId++;
        packs[id] = Pack(_dataHash, _price, _owner);
        emit Register(id, _datahash, _price);
    }

    function unregister(uint256 _packId) external onlyController {
        delete packs[_packId];
        emit Unregister(id);
    }

    function migrateMarket(address _newMarket) external onlyController {
        stickerPack.changeController(_newMarket);
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

    function _buy(address _buyer, Pack memory _pack) internal {
        require(_pack.dataHash != bytes32(0), "Bad pack");
        require(snt.transferFrom(_from, _pack.owner, _pack.price), "Bad payment");
        stickerPack.generateToken(_from, pack.dataHash);
    }

    /**
     * @dev Decodes abi encoded data with selector for "buy(uint256)".
     * @param _data Abi encoded data.
     * @return Decoded registry call.
     */
    function abiDecodeBuy(
        bytes _data
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
        require(sig == bytes4(keccak256("buy(uint256)")), "Bad method sig");
    }
}