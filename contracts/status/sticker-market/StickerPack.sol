pragma solidity >=0.5.0 <0.6.0;

import "../../common/Controlled.sol";
import "../../common/MerkleProof.sol";
import "../../token/UnfungibleToken.sol";
import "./Sticker.sol";


contract StickerPack is Controlled, UnfungibleToken {

    Sticker public sticker = new Sticker();
    uint256 public nextId;
    mapping(uint256 => bytes32) public dataHash; 
    mapping(bytes32 => bool) public unpacked;
    
    function unpack(uint256 _tokenId, bytes32[] calldata _proof, bytes32 _stickerData) external {
        address owner = getOwner(_tokenId);
        require(owner == msg.sender, "Unauthorized");
        require(MerkleProof.verify(_proof, dataHash[_tokenId], _stickerData), "Invalid proof");
        bytes32 unpackedHash = keccak256(abi.encodePacked(_tokenId, _stickerData));
        require(!unpacked[unpackedHash], "Duplicate unpacking");
        unpacked[unpackedHash] = true;
        sticker.generateToken(owner, _stickerData);
    }

    function repack(uint256 _packId, uint256 _stickerToken) external {
        address owner = getOwner(_packId);
        require(owner == getOwner(_stickerToken) && owner == msg.sender, "Unauthorized");
        bytes32 stickerData = sticker.dataHash(_stickerToken);
        bytes32 unpackedHash = keccak256(abi.encodePacked(_packId, stickerData));
        require(unpacked[unpackedHash],"Bad operation");
        delete unpacked[unpackedHash];
        sticker.destroyToken(owner, _stickerToken);
    }

    function generateToken(address _owner, bytes32 _dataHash) external onlyController returns (uint256 tokenId){
        tokenId = nextId++;
        dataHash[tokenId] = _dataHash;
        mint(_owner, tokenId);
    }

    function isStickerInPack(uint256 _packId, bytes32[] memory _proof, bytes32 _stickerData) public view returns (bool){
        require(MerkleProof.verify(_proof, dataHash[_packId], _stickerData), "Invalid proof");
        bytes32 unpackedHash = keccak256(abi.encodePacked(_packId, _stickerData));
        return !unpacked[unpackedHash];
    }
}
