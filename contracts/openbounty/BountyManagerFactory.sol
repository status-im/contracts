pragma solidity ^0.4.17;

import "../deploy/UpdatableInstance.sol";
import "./BountyManagerKernel.sol";

/** 
 * @title BountyManagerFactory
 * @dev Creates a BountyManager to be used by UpdatableInstance contract
 */
contract BountyManagerFactory {

    event InstanceCreated(address indexed pivot, address indexed repoOwner, address instance);

    BountyManagerKernel public bountyManagerKernel;

    function BountyManagerFactory(address _standardBountyFactory, address[] _owners)
        public
    {
        bountyManagerKernel = new BountyManagerKernel(_standardBountyFactory, _owners);
    }

    function createBountyManager(address _standardBountyFactory, address[] _owners) 
        external 
    {
        BountyManagerKernel instance = BountyManagerKernel(new UpdatableInstance(address(bountyManagerKernel)));
        instance.initBountyManager(_standardBountyFactory, _owners);
        InstanceCreated(_owners[0], _owners[1], address(instance));
    }


}