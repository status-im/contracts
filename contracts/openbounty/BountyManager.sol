pragma solidity ^0.4.18;

import "./Bounty.sol";
import "./BountyFactory.sol";
import "../deploy/Instance.sol";
import "../common/MultiSig.sol";

contract BountyManager is MultiSig { 
    
    address public pivot;
    address public repoOwner;
    BountyFactory factory;
    /**
     *
     */
    modifier onlyPivot(address _sender) {
        require(_sender == pivot);
        _;
    }

    /**
     *
     */
    modifier onlyRepoOwner(address _sender) {
        require(_sender == repoOwner);
        _;
    }

    /**
     *
     */
    modifier onlyControlled(address instance) {
        require(Bounty(instance).controller() == address(this));
        _;
    }
    
    /**
     *
     */
    function BountyManager(address _factory, address[] _owners) MultiSig(_owners, _owners.length) public {
        require(_owners.length > 1);
        pivot = _owners[0];
        repoOwner = _owners[1];
        factory = BountyFactory(_factory);
    }


    //////
    /// External 
    function newBounty(uint _timeout) 
        external
    {
        newBounty(msg.sender, _timeout);
    }

    function increaseRewardBounty(address _instance, address _destination, uint256 _amount) 
        external
    {
       increaseRewardBounty(msg.sender, _instance, _destination, _amount);
    }

    function decreaseRewardBounty(address _instance, address _destination, uint256 _amount) 
        external
    {
        decreaseRewardBounty(msg.sender, _instance, _destination, _amount);
    }

    function closeBounty(address _instance)
        external
    {
        closeBounty(msg.sender, _instance);
    }

    // Multisigned calls
    function finalizeBounty(address _instance) 
        external
        onlyMultiSig
        onlyControlled(_instance) 
    {
        Bounty(_instance).finalize();
    }

    function drainBounty(address _instance, address _destination, address[] _drainTokens) 
        external
        onlyMultiSig
        onlyControlled(_instance)
    {
        Bounty(_instance).drainBounty(_destination, _drainTokens);
    }

    ///////
    // Internal
    // Pivot or RepoOwner
    function newBounty(address _caller, uint _timeout) 
        internal
        ownerExists(_caller)
    {
        factory.createBounty(_timeout);
    }

    // Only Pivot
    function increaseRewardBounty(address _caller, address _instance, address _destination, uint256 _amount) 
        internal 
        onlyPivot(_caller)
        onlyControlled(_instance)
    {
        Bounty(_instance).increaseReward(_destination, _amount);
    }

    function decreaseRewardBounty(address _caller, address _instance, address _destination, uint256 _amount) 
        internal 
        onlyPivot(_caller)
        onlyControlled(_instance)
    {
        Bounty(_instance).decreaseReward(_destination, _amount);
    }

    //Only Repo Owner
    function closeBounty(address _caller, address _instance)
        internal
        onlyRepoOwner(_caller)
        onlyControlled(_instance)
    {
        Bounty(_instance).close();
    }


}