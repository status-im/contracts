pragma solidity >=0.5.0 <0.6.0;

import "../../deploy/InstanceFactory.sol";
import "../../deploy/Instance.sol";
import "./ProposalAbstract.sol";

/**
 * @title DelegationFactory
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * @dev Upgradable delegation proxy factory
 */
contract ProposalFactory is InstanceFactory {

    constructor(InstanceAbstract _base, InstanceAbstract _init, InstanceAbstract _emergency) 
        InstanceFactory(_base, _init, _emergency)
        public
    { }

    function createProposal(
        MiniMeToken _token,
        Delegation _delegation,
        bytes32 _topic,
        bytes32 _txHash,
        uint256 _tabulationBlockDelay,
        uint256 _blockStart,
        uint256 _blockEndDelay
    ) 
        external
        returns (ProposalAbstract instance)
    {
        instance = ProposalAbstract(new Instance(base, prototypes[address(base)].init, msg.data));
        emit InstanceCreated(instance);
    }

}