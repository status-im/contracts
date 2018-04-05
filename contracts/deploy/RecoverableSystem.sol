pragma solidity ^0.4.17;

import "./BasicSystemStorage.sol";
import "./DelegatedCall.sol";


/**
 * @title RecoverableSystem
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @dev Contract that recovers from dead system to recoverer.
 */
contract RecoverableSystem is BasicSystemStorage, DelegatedCall {

    /**
     * @dev Requires at least valid _recoverer, that can elect the first system.
     * @param _system the first system
     * @param _recover the recoverer contract 
     */
    function RecoverableSystem(address _system, address _recover) public {
        require(isOk(_recover));
        system = _system;
        recover = _recover;
    }

    /**
     * @dev delegatecall everything (but declared functions) to `_target()`
     */
    function () external payable delegated {
        //all goes to system (or recover)
    }

    /**
     * @dev checks if system is not in recovery mode
     */
    function isOk() public constant returns(bool a) {
        return isOk(system);
    }

    /**
     * @dev checks if `_a` contains code
     */
    function isOk(address _a) internal constant returns(bool r) {
        assembly{
            r := gt(extcodesize(_a), 0)
        }
    }

     /**
     * @dev returns system if system has code, otherwise return recover
     */
    function targetDelegatedCall()
        internal
        constant
        returns(address)
    {

        return isOk() ? system : recover;
    }


}