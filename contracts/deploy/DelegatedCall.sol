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
            //delegated execution
            bytes memory returnData;
            bool success;
            (success, returnData) = _target.delegatecall(msg.data);
            //exit-return delegatecall returnData
            assembly {
                switch success case 0 { revert(add(returnData, 0x20), mload(returnData)) }
                default { return(add(returnData, 0x20), mload(returnData)) }
            }

        }
    }

}
