pragma solidity ^0.4.21;

import "../token/MiniMeTokenInterface.sol";
import "./DelegationProxyFactory.sol";
import "./TrustNetwork.sol";
import "./ProposalCuration.sol";
import "./ProposalManager.sol";


contract Democracy {

    MiniMeTokenInterface public token;
    TrustNetwork public trustNet;
    ProposalManager public proposalManager;
    
    mapping (bytes32 => Allowance) topicAllowance;
    mapping (uint256 => bool) executedProposals;

    struct Allowance {
        mapping(address => bool) anyCall;
        mapping(bytes32 => bool) calls;
    }

    constructor(MiniMeTokenInterface _token, DelegationProxyFactory _delegationProxyFactory) public {
        token = _token;
        trustNet = new TrustNetwork(_delegationProxyFactory);
        proposalManager = new ProposalCuration(_token, trustNet).proposalManager();
    }

    function allowTopicSpecific(bytes32 _topic, address _destination, bytes4 _allowedCall, bool allowance)
        external
    {
        require(msg.sender == address(this));
        topicAllowance[_topic].calls[keccak256(_destination, _allowedCall)] = allowance;
    }

    function allowTopicAnyCall(bytes32 _topic, address _destination, bool allowance)
        external
    {
        require(msg.sender == address(this));
        topicAllowance[_topic].anyCall[_destination] = allowance;
    }

    function executeProposal(
        uint256 _proposalId,
        address _destination,
        uint _value,
        bytes _data
    ) 
        external 
        returns (bool success) 
    {
        require(!executedProposals[_proposalId]);
        executedProposals[_proposalId] = true;

        bytes32 topic;
        bytes32 txHash;
        bool approved;
        (topic, txHash, approved) = proposalManager.getProposal(_proposalId);
        require(approved);
        require(
            txHash == keccak256(
                _destination,
                _value,
                _data
            )
        );

        if(topic != 0x0) { //if not root topic
            Allowance storage allowed = topicAllowance[topic];
            if(!allowed.anyCall[_destination]){ //if topic not allowed any call to destination
                bytes memory data = _data;
                bytes4 calling; 
                assembly {
                    calling := mload(add(data, 4))
                }
                delete data;
                require(allowed.calls[keccak256(_destination, calling)]); //require call allowance
            }
        }

        //execute the call
        return _destination.call.value(_value)(_data);
    }

}