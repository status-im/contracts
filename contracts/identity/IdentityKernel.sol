pragma solidity ^0.4.17;

import "../deploy/DelayedUpdatableInstanceStorage.sol";
import "./Identity.sol";

contract IdentityKernel is DelayedUpdatableInstanceStorage, Identity {

    function initIdentity(address _caller) external {
        _constructIdentity(keccak256(_caller));
    }
}
