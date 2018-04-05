pragma solidity ^0.4.17;

import "./BasicSystemStorage.sol";


/**
 * @title KillableModel
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @dev A contract model that can be killed by a watchdog
 */
contract KillableModel is BasicSystemStorage {

     /**
     * @dev Library contract constructor initialize watchdog, able to kill the Library in case of 
     */
    function KillableModel(address _watchdog) public {
        watchdog = _watchdog;
    }

    function emergencyStop() public {
        require(msg.sender == watchdog);
        selfdestruct(watchdog);
    }

}