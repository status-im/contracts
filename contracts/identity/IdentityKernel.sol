pragma solidity ^0.4.17;

import "../deploy/DelayedUpdatableInstanceStorage.sol";
import "./IdentityGasRelay.sol";

contract IdentityKernel is DelayedUpdatableInstanceStorage, IdentityGasRelay {

    constructor() 
        Identity(
            new bytes32[](0),
            new uint256[](0),
            new uint256[](0),
            0,
            0,
            0
        ) 
        public
    {

    }

    function initIdentity(   
        bytes32[] _keys,
        uint256[] _purposes,
        uint256[] _types,
        uint256 _managerThreshold,
        uint256 _actorThreshold,
        address _recoveryContract
    ) external {
        _constructIdentity(
            _keys,
            _purposes,
            _types,
            _managerThreshold,
            _actorThreshold,
            _recoveryContract);
    }
}
