pragma solidity ^0.4.21;
import "./DemocracyInterface.sol";
import "./ProposalManager.sol";
import "./FeeRecycler.sol";

contract Democracy is DemocracyInterface {

    mapping (bytes32 => Allowance) topicAllowance;
    mapping (uint256 => bool) executedProposals;

    struct Allowance {
        mapping(address => bool) anyCall;
        mapping(bytes32 => bool) calls;
    }

    function Democracy(MiniMeTokenInterface _token, TrustNetworkInterface _trustNetwork) public {
        token = _token;
        trustNet = _trustNetwork;
        feeCollector = new FeeRecycler(_token);
        proposalManager = new ProposalManager(_token, _trustNetwork, feeCollector);
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