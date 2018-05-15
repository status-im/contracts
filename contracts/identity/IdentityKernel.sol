pragma solidity ^0.4.17;

import "../deploy/DelayedUpdatableInstanceStorage.sol";
import "./Identity.sol";

contract IdentityKernel is DelayedUpdatableInstanceStorage, Identity {

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
        constructIdentity(
            _keys,
            _purposes,
            _types,
            _managerThreshold,
            _actorThreshold,
            _recoveryContract);
    }
}
