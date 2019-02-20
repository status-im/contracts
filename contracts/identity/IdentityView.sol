pragma solidity >=0.5.0 <0.6.0;

import "./IdentityAbstract.sol";
import "../deploy/DelegatedCall.sol";

/**
 * @title IdentityView
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @notice Abstract external views for code reuse
 */
contract IdentityView is IdentityAbstract {
    
    constructor() internal {}
    
    function getKey(
        bytes32 _key
    ) 
        external 
        view 
        returns(Purpose[] memory purposes, uint256 keyType, bytes32 key) 
    {
        Key storage myKey = keys[keccak256(abi.encodePacked(_key, salt))];
        return (myKey.purposes, myKey.keyType, myKey.key);
    }
    
    function keyHasPurpose(bytes32 _key, Purpose _purpose) 
        external
        view 
        returns (bool exists) 
    {
        return _keyHasPurpose(_key, _purpose);
    }

    function getKeyPurpose(bytes32 _key)
        external 
        view 
        returns(Purpose[] memory purpose)
    {
        return keys[keccak256(abi.encodePacked(_key, salt))].purposes;
    }
    
    function getKeysByPurpose(Purpose _purpose)
        external
        view
        returns(bytes32[] memory)
    {
        return keysByPurpose[keccak256(abi.encodePacked(_purpose, salt))];
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
            ) 
    {
        Claim memory _claim = claims[_claimId];
        return (_claim.topic, _claim.scheme, _claim.issuer, _claim.signature, _claim.data, _claim.uri);
    }
    
    function getClaimIdsByTopic(uint256 _topic)
        external
        view
        returns(bytes32[] memory claimIds)
    {
        return claimsByType[_topic];
    }
   
}

