pragma solidity ^0.4.17;

import "./BountyManagerPreSigned.sol";

contract BountyManagerKernel is BountyManagerPreSigned {

    function BountyManagerKernel(address _factory, address[] _owners) 
        BountyManagerPreSigned(_factory, _owners) 
        public 
    {
    
    }

    function initBountyManager(address _factory, address[] _owners) 
        external
    {
        require(owners.length == 0);
        require(_owners.length > 1);
        require(_factory != address(0));
        for (uint i = 0; i < _owners.length; i++) {
            require (!isOwner[_owners[i]] && _owners[i] != address(0));
            isOwner[_owners[i]] = true;
        }
        owners = _owners;
        required = _owners.length;
        pivot = _owners[0];
        repoOwner = _owners[1];
        factory = StandardBountyFactory(_factory);
    }
}