pragma solidity ^0.4.17;

import "../deploy/InstanceStorage.sol";
import "./Identity.sol";

contract IdentityKernel is InstanceStorage, Identity {

    function initIdentity(address _caller) external {
        _constructIdentity(_caller);
    }
}
