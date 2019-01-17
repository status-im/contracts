pragma solidity >=0.5.0 <0.6.0;

import "../../common/Controlled.sol";
import "../../common/MerkleProof.sol";
import "../../token/UnfungibleToken.sol";
import "./Sticker.sol";


contract StickerPack is Controlled, UnfungibleToken {

    uint256 public nextId;
    mapping(uint256 => bytes32) public dataHash; 

    function generateToken(address _owner, bytes32 _dataHash) external onlyController returns (uint256 tokenId){
        tokenId = nextId++;
        dataHash[tokenId] = _dataHash;
        mint(_owner, tokenId);
    }

    function containsSticker(uint256 _packId, bytes32 _stickerData, bytes32[] memory _proof) public view returns (bool){
        return MerkleProof.verify(_proof, dataHash[_packId], _stickerData);
    }

}
