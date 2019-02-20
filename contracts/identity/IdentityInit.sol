pragma solidity >=0.5.0 <0.6.0;

import "./IdentityEmpty.sol";

/**
 * @title Initializer Extension
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @dev should be used only as constructor for Extendable contract 
 * @notice Cannot be used stand-alone, use IdentityFactory.createIdentity
 */
  
contract IdentityInit is IdentityEmpty {
    
    modifier notInitialized {
        require(purposeThreshold[uint256(Purpose.ManagementKey)] == 0, "Unauthorized");
        _;
    }

    constructor() 
        public
    {
        purposeThreshold[uint256(Purpose.ManagementKey)] = 1;
    }
    
    function createIdentity(
        bytes32 _ownerKey
    ) 
        external 
        notInitialized
        returns (IdentityAbstract)
    {
        purposeThreshold[uint256(Purpose.ManagementKey)] = 1;
        purposeThreshold[uint256(Purpose.ActionKey)] = 1;
        _addKey(_ownerKey, Purpose.ManagementKey, 0, 0);
        _addKey(_ownerKey, Purpose.ActionKey, 0, 0);
        prototypeRegistry = PrototypeRegistry(msg.sender);
    }

    function createIdentity(   
        bytes32[] calldata _keys,
        Purpose[] calldata _purposes,
        uint256[] calldata _types,
        uint256 _managerThreshold,
        uint256 _actorThreshold
    ) 
        external 
        notInitialized
        returns (IdentityAbstract)
    {
        uint len = _keys.length;
        require(len > 0, "Bad argument");
        require(len == _purposes.length, "Wrong purposes lenght");
        require(len == _types.length, "Wrong types lenght");
        uint256 _salt = salt;
        uint managersAdded = 0;
        for(uint i = 0; i < len; i++) {
            Purpose _purpose = _purposes[i];
            _addKey(_keys[i], _purpose, _types[i], _salt);
            if(_purpose == Purpose.ManagementKey) {
                managersAdded++;
            }
        }
        require(_managerThreshold <= managersAdded, "Managers added is less then required");
        purposeThreshold[uint256(Purpose.ManagementKey)] = _managerThreshold;
        purposeThreshold[uint256(Purpose.ActionKey)] = _actorThreshold;
        prototypeRegistry = PrototypeRegistry(msg.sender);        
    }

}
