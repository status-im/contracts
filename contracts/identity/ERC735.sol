pragma solidity ^0.4.17;

contract ERC735 {

    event ClaimRequested(bytes32 indexed claimId, uint256 indexed claimType, address indexed issuer, uint256 signatureType, bytes signature, bytes claim, string uri);
    event ClaimAdded(bytes32 indexed claimId, uint256 indexed claimType, address indexed issuer, uint256 signatureType, bytes signature, bytes claim, string uri);
    event ClaimRemoved(bytes32 indexed claimId, uint256 indexed claimType,  address indexed issuer, uint256 signatureType, bytes signature, bytes claim, string uri);
    event ClaimChanged(bytes32 indexed claimId, uint256 indexed claimType,  address indexed issuer, uint256 signatureType, bytes signature, bytes claim, string uri);

    struct Claim {
        uint256 claimType;
        address issuer; // msg.sender
        uint256 signatureType; // The type of signature
        bytes signature; // this.address + claimType + claim
        bytes claim;
        string uri;
    }

    function getClaim(bytes32 _claimId) public constant returns(uint256 claimType, address issuer, uint256 signatureType, bytes signature, bytes claim, string uri);
    function getClaimsIdByType(uint256 _claimType) public constant returns(bytes32[]);
    function addClaim(uint256 _claimType, address issuer, uint256 signatureType, bytes _signature, bytes _claim, string _uri) public returns (bytes32 claimId);
    function removeClaim(bytes32 _claimId) public returns (bool success);
}