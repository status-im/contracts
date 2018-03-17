pragma solidity ^0.4.17;

import "../common/Controlled.sol";
import "../deploy/Instance.sol";
import "../BountyKernel.sol";

/** 
 * @title BountyKernel
 * @dev Creates a Bounty to be used by Instance contract
 */
contract BountyFactory is Controlled {

    event InstanceCreated(address indexed controller, address instance);

    BountyKernel public standardBountyKernel;

    function BountyFactory()
        public
    {
        standardBountyKernel = new BountyKernel();
    }

    function drainKernel(address _destination, address[] _drainTokens) 
        external
        onlyController
    {
        standardBountyKernel.drainBounty(_destination, _drainTokens);
    }

    function createBounty(uint _timeout) 
        external
    {
        createBounty(msg.sender, _timeout);
    }

    function createBounty(address _controller, uint _timeout) 
        public 
    {
        BountyKernel instance = BountyKernel(new Instance(address(standardBountyKernel)));
        instance.initBounty(_controller, _timeout);
        InstanceCreated(_controller, address(instance));
    }


}