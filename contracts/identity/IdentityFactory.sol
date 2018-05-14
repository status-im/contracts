pragma solidity ^0.4.17;

import "../deploy/Factory.sol";
import "../deploy/DelayedUpdatableInstance.sol";
import "./IdentityKernel.sol";


contract IdentityFactory is Factory {

    event IdentityCreated(address instance);

    constructor() 
        public
        Factory(new IdentityKernel()) 
    {
    }

    function createIdentity() 
        external 
        returns (address)
    {      
        
        bytes32[] memory initKeys = new bytes32[](2);
        uint256[] memory initPurposes = new uint256[](2);
        uint256[] memory initTypes = new uint256[](2);
        initKeys[0] = keccak256(msg.sender);
        initKeys[1] = initKeys[0];
        initPurposes[0] = 0;
        initPurposes[1] = 1;
        initTypes[0] = 0;
        initTypes[1] = 0;
        return createIdentity(
            initKeys,
            initPurposes,
            initTypes,
            1,
            1,
            0
            );
    }

    function createIdentity(   
        bytes32[] _keys,
        uint256[] _purposes,
        uint256[] _types,
        uint256 _managerThreshold,
        uint256 _actorThreshold,
        address _recoveryContract
    ) 
        public 
        returns (address)
    {
        IdentityKernel instance = IdentityKernel(new DelayedUpdatableInstance(address(latestKernel)));
        instance.initIdentity(_keys,_purposes,_types,_managerThreshold,_actorThreshold,_recoveryContract);
        emit IdentityCreated(address(instance));
        return instance;
    }

}
