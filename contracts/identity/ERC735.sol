pragma solidity >=0.5.0 <0.6.0;

interface ERC735 {

    event ClaimRequested(
        bytes32 indexed claimRequestId,
        uint256 indexed topic,
        uint256 scheme,
        address indexed issuer,
        bytes signature,
        bytes data,
        string uri
    );   
    event ClaimAdded(
        bytes32 indexed claimId, 
        uint256 indexed topic,
        uint256 scheme, 
        address indexed issuer, 
        bytes signature, 
        bytes data, 
        string uri
    );
    event ClaimRemoved(
        bytes32 indexed claimId, 
        uint256 indexed topic, 
        uint256 scheme, 
        address indexed issuer, 
        bytes signature, 
        bytes data,
        string uri
    );
    event ClaimChanged(
        bytes32 indexed claimId,
        uint256 indexed topic, 
        uint256 scheme, 
        address indexed issuer, 
        bytes signature, 
        bytes data, 
        string uri
    );

    struct Claim {
        uint256 topic;
        uint256 scheme;
        address issuer; // msg.sender
        bytes signature; // this.address + topic + data
        bytes data;
        string uri;
    }

    function getClaim(bytes32 _claimId) 
        external
        view
        returns(
            uint256 topic,
            uint256 scheme,
            address issuer,
            bytes memory signature,
            bytes memory data,
            string memory uri
        );
    
    function getClaimIdsByTopic(uint256 _topic) 
        external 
        view 
        returns(bytes32[] memory claimIds);
    
    function addClaim(
        uint256 _topic,
        uint256 _scheme,
        address _issuer,
        bytes calldata _signature,
        bytes calldata _data,
        string calldata _uri
    ) 
        external 
        returns (bytes32 claimRequestId);

    function removeClaim(bytes32 _claimId) external returns (bool success);
}