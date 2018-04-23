pragma solidity ^0.4.17;

import "../deploy/Factory.sol";
import "../deploy/DelayedUpdatableInstance.sol";
import "./IdentityKernel.sol";


contract IdentityFactory is Factory {

    event IdentityCreated(address instance);

    function IdentityFactory(bytes _infohash) 
        public
        Factory(new IdentityKernel())
    {
    }

    function createIdentity() 
        external 
        returns (address)
    {
        return createIdentity(msg.sender);
    }

    function createIdentity(address _idOwner) 
        public 
        returns (address)
    {
        IdentityKernel instance = IdentityKernel(new DelayedUpdatableInstance(address(latestKernel)));
        instance.initIdentity(_idOwner);
        emit IdentityCreated(address(instance));
        return instance;
    }

}
