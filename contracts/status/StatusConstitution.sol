pragma solidity ^0.4.17;

import "./ConstitutionStorage.sol";
import "../token/MiniMeToken.sol";
import "../democracy/TrustNetworkInterface.sol";
import "../democracy/ProposalManager.sol";
import "../registry/TokenRegistry.sol";


/**
 * @title StatusConstitution
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @dev 
 */
contract StatusConstitution is ConstitutionStorage {

    function StatusConstitution(address _statusNetworkToken, address _statusNetworkTrust, address _stakeBank) public {
        token = MiniMeTokenInterface(_statusNetworkToken);
        trustNet = TrustNetworkInterface(_statusNetworkTrust);
        proposalManager = new ProposalManager(token, trustNet);
        
    }

    function installModule(address _module, bytes _data) external {
        require(msg.sender == address(this));
        require(_module.delegatecall(_data));
    }

    function executeProposal(
        bytes32 _topic,
        uint256 _proposalId,
        address _destination,
        uint _value,
        bytes _data
    ) 
        external 
        returns (bool success) 
    {
        require(msg.sender == address(proposalManager));
        if (_destination == address(this)) {
            require(_topic == 0);
        } else {
            bytes memory data = _data;
            bytes4 calling; 
            assembly {
                calling := mload(add(data, 4))
            }
            delete data;
            require(_topic == keccak256(_destination) || _topic == keccak256(_destination, calling)); 
        }

        return _destination.call.value(_value)(_data);
    }

}