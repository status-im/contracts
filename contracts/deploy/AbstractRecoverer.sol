pragma solidity ^0.4.17;

import "./BasicSystemStorage.sol";


/**
 * @title AbstractRecoverer
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @dev Abstract recoverer contract that should be crafted to alter `address system` storage 
 * in delegated logic contracts.
 */
contract AnstractRecoverer is BasicSystemStorage {
    
     /**
     * @dev will be callable in emergency state of RecorverableSystem
     */
    function recoverSystem(address newSystem) public {
        require(msg.sender == consensusContract());
        system = newSystem;
    }
    
     /**
     * @dev returns the consesus contract, can be a multisig or other DAO
     * should be implemented by a child contract
     */
    function consensusContract() public constant returns(address);


}