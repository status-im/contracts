pragma solidity >=0.5.0 <0.6.0;

import "../../common/Controlled.sol";
import "../../common/MerkleProof.sol";
import "../../token/NonfungibleToken.sol";


contract StickerPack is Controlled, NonfungibleToken {

    uint256 public nextId; //counter of created tokens
    mapping(uint256 => bytes32) public dataHash; //metadata

    /**
     * @notice controller can generate tokens at will
     * @param _owner account being included new token
     * @param _dataHash metadata merkle tree root of "EIP1577 sticker contenthash" leafs
     * @return tokenId created
     */
    function generateToken(address _owner, bytes32 _dataHash) external onlyController returns (uint256 tokenId){
        return generateStickerPackToken(_owner, _dataHash);
    }

    /** 
     * @notice checks if a specific `_stickerData` is contained in `_tokenId` merkleRoot by checking `_proof` 
     * @param _tokenId token being checked
     * @param _stickerData leaf, metadata hash 
     * @param _proof merkle proof
     * @return true if valid
     */
    function containsSticker(uint256 _tokenId, bytes32 _stickerData, bytes32[] memory _proof) public view returns (bool){
        return MerkleProof.verify(_proof, dataHash[_tokenId], _stickerData);
    }
    
    /**
     * @dev creates new NFT
     */
    function generateStickerPackToken(address _owner, bytes32 _dataHash) internal returns (uint256 tokenId){
        tokenId = nextId++;
        dataHash[tokenId] = _dataHash;
        mint(_owner, tokenId);
    }

}
