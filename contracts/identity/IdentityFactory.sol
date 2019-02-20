pragma solidity >=0.5.0 <0.6.0;

import "../deploy/InstanceFactory.sol";
/**
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @notice creates Instance as Identity 
 */
contract IdentityFactory is InstanceFactory {

    constructor(InstanceAbstract _base, InstanceAbstract _init, InstanceAbstract _emergency) 
        InstanceFactory(_base, _init, _emergency)
        public
    { }
    
    function createIdentity() 
        external 
        returns (InstanceAbstract instance)
    {
        bytes32 senderKey = keccak256(abi.encodePacked(msg.sender));
        instance = newInstance(
            base,
            prototypes[address(base)].init,
            abi.encodeWithSignature(
                "createIdentity(bytes32)",
                senderKey
            ),
            uint256(senderKey)
        );
        
        emit InstanceCreated(instance);
    }


    function createIdentity(
        bytes32 _senderKey
    ) 
        external 
        returns (InstanceAbstract instance) 
    {
        instance = newInstance(base, prototypes[address(base)].init, msg.data, uint256(_senderKey));
        emit InstanceCreated(instance);
    }


    function createIdentity(
        bytes32 _senderKey,
        uint256 _salt
    ) 
        external 
        returns (InstanceAbstract instance) 
    {
        instance = newInstance(
            base,
            prototypes[address(base)].init,
            abi.encodeWithSignature(
                "createIdentity(bytes32)",
                _senderKey
            ),
            _salt
        );
        emit InstanceCreated(instance);
    }

    function createIdentity(   
        bytes32[] calldata _keys,
        uint8[] calldata _purposes,
        uint256[] calldata _types,
        uint256 _managerThreshold,
        uint256 _actorThreshold,
        uint256 _salt
    ) 
        external 
        returns (InstanceAbstract instance)
    {
        instance = newInstance(
            base,
            prototypes[address(base)].init,
            abi.encodeWithSignature(
                "createIdentity(bytes32[],uint8[],uint256[],uint256,uint256)",
                _keys,
                _purposes,
                _types,
                _managerThreshold,
                _actorThreshold
            ),
            _salt
        );
        emit InstanceCreated(instance);
    }

}
