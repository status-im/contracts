pragma solidity ^0.4.17;

import "../deploy/Factory.sol";
import "../deploy/UpdatableInstance.sol";
import "./IdentityKernel.sol";

contract IdentityFactory is Factory {

    event IdentityCreated(address instance);

    function IdentityFactory(bytes _infohash) 
        Factory(new IdentityKernel(), _infohash)
        public
    {
        
    }

    function createIdentity() 
        external 
    {
        createIdentity(msg.sender);
    }

    function createIdentity(address _idOwner) 
        public 
    {
        IdentityKernel instance = IdentityKernel(new UpdatableInstance(address(latestKernel)));
        instance.initIdentity(_idOwner);
        IdentityCreated(address(instance));
    }

}
