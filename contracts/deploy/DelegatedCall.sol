pragma solidity >=0.5.0 <0.6.0;


/**
 * @title DelegatedCall
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @dev Encapsulates delegatecall related logic.
 */
contract DelegatedCall {

    constructor(address _init, bytes memory _initMsg) internal {
        if(_init == address(0)) return;
        bool success;
        (success, ) = _init.delegatecall(_initMsg);
        require(success, "Delegated Construct fail");
    }
    /**
     * @dev delegates the call of this function
     */
    modifier delegateAndReturn(address _target) {
        if(_target == address(0)) {
            _; //normal execution 
        } else {
            (bool success, bytes memory returnData) = _target.delegatecall(msg.data);
            if(success){
                assembly {
                    return(add(returnData, 0x20), returnData) 
                }
            } else {
                assembly {
                    revert(add(returnData, 0x20), returnData) 
                }
            }

        }
    }

}
