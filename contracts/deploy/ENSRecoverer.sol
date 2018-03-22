pragma solidity ^0.4.17;

import "./AbstractRecoverer.sol";
import "../ens/ENS.sol";


/**
* @title ENSRecoverer
* @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
* @dev Common abstract recoverer resolved from ens.
*/
contract ENSRecoverer is AbstractRecoverer {
    /**
    * @dev resolves consensusContract from ens.
    */
    function consensusContract() public constant returns(address) {
        bytes32 node = ensNode();
        return ensRoot().resolver(node).addr(node);
    }

    function ensNode() public constant returns(bytes32);
    function ensRoot() public constant returns(ENS);

}