pragma solidity ^0.4.17;

import "../deploy/DelayedUpdatableInstanceStorage.sol";
import "./IdentityGasRelay.sol";

contract IdentityKernel is DelayedUpdatableInstanceStorage, IdentityGasRelay {

    function initIdentity(address _caller) external {
        _constructIdentity(_caller);
    }
}
