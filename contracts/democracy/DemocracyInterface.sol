pragma solidity ^0.4.21;

import "./DemocracyStorage.sol";

/**
 * @title DemocracyInterface
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 */
contract DemocracyInterface is DemocracyStorage {    
    
    function executeProposal(
        uint256 _proposalId,
        address _destination,
        uint _value,
        bytes _data
    ) 
        external 
        returns(bool success);


}