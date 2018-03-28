pragma solidity ^0.4.21;
import "./DemocracyInterface.sol";
import "./ProposalManager.sol";

contract Democracy is DemocracyInterface {

    mapping (bytes32 => Allowance) topicAllowance;

    struct Allowance {
        mapping(address => bool) anyCall;
        mapping(bytes32 => bool) calls;
    }

    function Democracy(address _baseToken, address _trustNetwork) public {
        token = MiniMeTokenInterface(_baseToken);
        trustNet = TrustNetworkInterface(_trustNetwork);
        proposalManager = new ProposalManager(token, trustNet);
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
        bytes32 topic;
        bytes32 txHash;
        bool approved;
        bool executed;
        (topic, txHash, approved, executed) = proposalManager.getProposal(_proposalId);
        require(approved);
        require(!executed);
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
        
        // save that this was executed
        require(
            proposalManager.setExecuted(
                _proposalId, 
                txHash
            )
        ); 
        
        //execute the call
        return _destination.call.value(_value)(_data);
    }

}