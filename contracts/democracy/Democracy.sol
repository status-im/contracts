pragma solidity >=0.5.0 <0.6.0;

import "../token/MiniMeToken.sol";
import "./DelegationFactory.sol";
import "./DefaultDelegation.sol";
import "./TrustNetwork.sol";
import "./ProposalCuration.sol";
import "./ProposalManager.sol";


contract Democracy {

    MiniMeToken public token;
    TrustNetwork public trustNet;
    ProposalManager public proposalManager;
    
    mapping (bytes32 => mapping (address => mapping (bytes32 => bool))) allowance;
    mapping (uint256 => bool) executedProposals;

    modifier selfOnly {
        require(msg.sender == address(this), "Unauthorized");
        _;
    }

    constructor(MiniMeToken _token, DelegationFactory _DelegationFactory, address defaultDelegate) public {
        token = _token;
        trustNet = new TrustNetwork(_DelegationFactory, new DefaultDelegation(defaultDelegate));
        proposalManager = new ProposalCuration(_token, trustNet).proposalManager();
    }

    function executeProposal(
        uint256 _proposalId,
        address _destination,
        bytes calldata _data
    ) 
        external 
        returns (bool success, bytes memory r) 
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
                abi.encodePacked(
                    _destination,
                    _data
                )
            )
        );

        if(topic != bytes32(0)) { //if not root topic
            bytes memory data = _data;
            bytes4 sig; 
            assembly {
                sig := mload(add(data, 4))
            }
            delete sig;
            require(isTopicAllowed(topic, _destination, sig)); //require call allowance
        }

        //execute the call
        (success, r) = _destination.call(_data);
    }

    function setTopicAllowance(bytes32 _topic, address _destination, bytes4 _callSig, bool _allowed) external selfOnly {
        require(_topic != bytes32(0), "Cannot change root topic");
        allowance[_topic][_destination][_callSig] = _allowed;
    }

    function setProposalManager(ProposalManager _proposalManager) external selfOnly {
        require(address(_proposalManager) != address(0), "Bad call");
        proposalManager = _proposalManager;
    }

    function setTrustNetwork(TrustNetwork _trustNet) external selfOnly {
        require(address(_trustNet) != address(0), "Bad call");
        trustNet = _trustNet;
    }

    function setToken(MiniMeToken _token) external selfOnly {
        require(address(_token) != address(0), "Bad call");
        token = _token;
    }

    function isTopicAllowed(
        bytes32 topic, 
        address destinAddr, 
        bytes4 calledSig
    ) 
        public 
        view 
        returns (bool) 
    {

        return allowance[topic][destinAddr][calledSig]
            || allowance[topic][destinAddr][bytes4(0)]
            || allowance[topic][address(0)][calledSig]
            || allowance[topic][address(0)][bytes4(0)]
            || allowance[topic][destinAddr][calledSig]
            || allowance[topic][destinAddr][bytes4(0)]
            || allowance[topic][address(0)][calledSig]
            || allowance[topic][address(0)][bytes4(0)];
    }
}