pragma solidity >=0.5.0 <0.6.0;

import "../common/Controlled.sol";
import "./InstanceAbstract.sol";

contract PrototypeRegistry is Controlled {
    event PrototypeAdd(InstanceAbstract _base, InstanceAbstract _init, InstanceAbstract _emergency);
    event PrototypeDel(InstanceAbstract _base);
    event UpgradeApprove(InstanceAbstract _baseFrom, InstanceAbstract _baseTo, bool _approve);
    event ExtensionApprove(InstanceAbstract _base, InstanceAbstract _extension, bool _approve);
    
    struct Prototype {
        InstanceAbstract init;
        InstanceAbstract emergency;
    }

    mapping(address => Prototype) public prototypes;
    mapping(address => bool) private bases;
    mapping(bytes32 => bool) private upgradable;
    mapping(bytes32 => bool) private extensions;


    function addPrototype(InstanceAbstract _base, InstanceAbstract _init, InstanceAbstract _emergency) external onlyController {
        newPrototype(_base,_init,_emergency);
    }

    function delPrototype(InstanceAbstract _base) external onlyController {
        clearPrototype(_base);
    }

    function approveUpgrade(InstanceAbstract _baseFrom, InstanceAbstract _baseTo, bool _approve) external onlyController {
        setUpgradable(_baseFrom, _baseTo, _approve);
    }

    function approveExtension(InstanceAbstract _base, InstanceAbstract _extension, bool _approve) external onlyController {
        setExtension(_base, _extension, _approve);
    }

    function isBase(InstanceAbstract _base) external view returns(bool){
        return bases[address(_base)];
    }

    function isUpgradable(InstanceAbstract _baseFrom, InstanceAbstract _baseTo) external view returns(bool){
        return upgradable[keccak256(abi.encodePacked(_baseFrom, _baseTo))];
    }

    function isExtension(InstanceAbstract _base, InstanceAbstract _extension) external view returns(bool){
        return extensions[keccak256(abi.encodePacked(_base, _extension))];
    }

    function getInit(InstanceAbstract base) external view returns (InstanceAbstract init){
        return prototypes[address(base)].init;
    }

    function getEmergency(InstanceAbstract base) external view returns (InstanceAbstract emergency){
        return prototypes[address(base)].emergency;
        
    }

    function newPrototype(InstanceAbstract _base, InstanceAbstract _init, InstanceAbstract _emergency) internal {
        prototypes[address(_base)] = Prototype(_init, _emergency);
        bases[address(_base)] = true;
        if(address(_emergency) != address(0)){
            bases[address(_emergency)] = true;  
            setUpgradable(_base, _emergency, true);
            setUpgradable(_emergency, _base, true);
        }
        emit PrototypeAdd(_base,_init,_emergency);
    }

    function clearPrototype(InstanceAbstract _base) internal {
        delete prototypes[address(_base)];
        emit PrototypeDel(_base);
    }

    function setUpgradable(InstanceAbstract _baseFrom, InstanceAbstract _baseTo, bool _approve) internal {
        upgradable[keccak256(abi.encodePacked(_baseFrom, _baseTo))] = _approve;
        emit UpgradeApprove(_baseFrom, _baseTo, _approve);
    }

    function setExtension(InstanceAbstract _base, InstanceAbstract _extension, bool _approve) internal {
        extensions[keccak256(abi.encodePacked(_base, _extension))] = _approve;
        emit ExtensionApprove(_base,_extension,_approve);
    }

}