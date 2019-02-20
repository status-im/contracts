pragma solidity >=0.5.3 <0.6.0;

import "../deploy/Instance.sol";
import "../deploy/PrototypeRegistry.sol";


/**
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @notice creates Instance and registry for updates and extensions
 */
contract InstanceFactory is PrototypeRegistry {

    InstanceAbstract public base;

    event InstanceCreated(InstanceAbstract instance);

    constructor(InstanceAbstract _base, InstanceAbstract _init, InstanceAbstract _emergency) 
        public
    {
        base = _base;
        newPrototype(_base, _init, _emergency);
    }

    /** 
     * @notice creates instance, passing msg.data to Instance constructor that delegatecalls to init 
     * @dev should be the same method signature of `init` function 
     */
    function ()
        external 
    {
        Instance instance = newInstance(
            base,
            prototypes[address(base)].init,
            msg.data,
            uint256(keccak256(abi.encodePacked(msg.sender)))
        );
        emit InstanceCreated(instance);
        //TODO: Assembly return instance 
    }

    function newInstance(
        InstanceAbstract _base,
        InstanceAbstract _init,
        bytes memory _data,
        uint256 _salt
    ) public returns (Instance createdContract) {
        bool failed;
        bytes memory _code = abi.encodePacked(type(Instance).creationCode, abi.encode(_base,_init,_data));
        assembly {
            createdContract := create2(0, add(_code, 0x20), mload(_code), _salt) //deploy
            failed := iszero(extcodesize(createdContract))
        }
        require(!failed, "deploy failed");
    }

    function updateBase(
        InstanceAbstract _base,
        InstanceAbstract _init,
        InstanceAbstract _emergency,
        bool upgradable,
        bool downgradable
    ) 
        external 
        onlyController
    {
        newPrototype(_base, _init, _emergency);
        if (upgradable) {
            setUpgradable(base, _base, true);
        }
        if (downgradable) {
            setUpgradable(_base, base, true);
        }
        base = _base;
    }
}
