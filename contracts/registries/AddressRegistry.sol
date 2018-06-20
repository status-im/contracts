pragma solidity ^0.4.23;

import "../common/Controlled.sol";


interface IRegistry {
    
        function add(address a) external;
        
        function remove(address a) external;
        
        function exists(address a) external view returns (bool);
}


contract AddressRegistry is IRegistry, Controlled {
    
    event AddressAdded(address a);
    event AddressRemoved(address a);
    
    mapping(address => bool) addresses;
    
    function add(address a) external onlyController {
        addresses[a] = true;
        emit AddressAdded(a);
    }
    
    function remove(address a) external onlyController {
        delete addresses[a];
        emit AddressRemoved(a);
    }
    
    function exists(address a) external view returns (bool) {
        return addresses[a];
    }
    
}