pragma solidity >=0.5.0 <0.6.0;

import "../../common/Controlled.sol";
import "../../common/MerkleProof.sol";
import "../../token/NonfungibleToken.sol";


contract StickerPack is Controlled, NonfungibleToken {

    uint256 public nextId; //counter of created tokens
    mapping(uint256 => uint256) public tokenMarketId; //marketId

    /**
     * @notice controller can generate tokens at will
     * @param _owner account being included new token
     * @param _marketId metadata merkle tree root of "EIP1577 sticker contenthash" leafs
     * @return tokenId created
     */
    function generateToken(address _owner, uint256 _marketId) external onlyController returns (uint256 tokenId){
        return generateStickerPackToken(_owner, _marketId);
    }
    
    /**
     * @dev creates new NFT
     */
    function generateStickerPackToken(address _owner, uint256 _marketId) internal returns (uint256 tokenId){
        tokenId = nextId++;
        tokenMarketId[tokenId] = _marketId;
        mint(_owner, tokenId);
    }

}
