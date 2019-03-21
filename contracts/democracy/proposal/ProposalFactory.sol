pragma solidity >=0.5.0 <0.6.0;

import "../../deploy/InstanceFactory.sol";
import "../../deploy/Instance.sol";
import "./ProposalAbstract.sol";

/**
 * @title ProposalFactory
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * @dev Creates Proposal instances. 
 */
contract ProposalFactory is InstanceFactory {

    constructor(InstanceAbstract _base, InstanceAbstract _init, InstanceAbstract _emergency) 
        InstanceFactory(_base, _init, _emergency)
        public
    { }

    function createProposal(
        MiniMeToken /*_token*/,
        Delegation /*_delegation*/,
        bytes32 /*_dataHash*/,
        uint256 /*_tabulationBlockDelay*/,
        uint256 /*_blockStart*/,
        uint256 /*_blockEndDelay*/,
        Proposal.QuorumType /*_quorum*/
    ) 
        external
        returns (ProposalAbstract instance)
    {
        instance = ProposalAbstract(address(new Instance(base, prototypes[address(base)].init, msg.data)));
        emit InstanceCreated(instance);
    }

}