pragma solidity >=0.5.0 <0.6.0;

import "./IdentityView.sol";
import "../deploy/PrototypeRegistry.sol";

/**
 * @title Identity Emergency Base
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @notice Cannot be used stand-alone, use IdentityFactory.createIdentity
 */
contract IdentityEmergency is IdentityView {
    
    function execute(address, uint256, bytes calldata) external returns (uint256) {}
    function addKey(bytes32, Purpose, uint256) external returns (bool) {}
    function removeKey(bytes32, Purpose) external returns (bool) {}
    function addClaim(uint256,uint256,address,bytes calldata,bytes calldata,string calldata) external returns (bytes32) {}
    function removeClaim(bytes32) external returns (bool) {}

    /**
     * @notice approve a multisigned execution
     * @param _txId unique id multisig transaction
     * @param _approval approve (true) or reject (false)
     */
    function approve(uint256 _txId, bool _approval) 
        external 
        returns (bool success)
    {   
        return _approveRequest(keccak256(abi.encodePacked(msg.sender)), _txId, _approval);
    }

    function installBase(
        IdentityAbstract _newBase,
        bytes calldata _installMsg
    ) 
        external
        managementOnly
    {
        require(prototypeRegistry.isUpgradable(base,_newBase));
        bool success;
        (success, ) = address(_newBase).delegatecall(_installMsg);
    }

}

