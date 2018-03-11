pragma solidity ^0.4.17;

import "../common/Controlled.sol";
import "./BurnedFeeLocker.sol";

contract RecyclerManager is Controlled { 

    address burnContract;
    mapping (address => bool) bounties;

    function RecyclerManager(address _burnContract) public {
        burnContract = _burnContract;
    }

    function recycleFeeIntoSOB(address bounty, uint256 amount) external {
        require(bounties[bounty]);
        BurnedFeeLocker(burnContract).recycleFee(msg.sender, bounty, amount);
    }

    function setBounty(address bounty, bool enabled) external onlyController {
        bounties[bounty] = enabled;
    }



}