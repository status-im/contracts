pragma solidity ^0.4.23;

import "../common/Controlled.sol";


interface IRegistry {
    
        function add(bytes a) external;
        
        function remove(bytes a) external;
        
        function exists(bytes a) external view returns (bool);
}


contract MailServerRegistry is IRegistry, Controlled {
    
    event MailServerAdded(bytes a);
    event MailServerRemoved(bytes a);
    
    mapping(bytes => bool) servers;
    
    function add(bytes a) external onlyController {
        servers[a] = true;
        emit MailServerAdded(a);
    }
    
    function remove(bytes a) external onlyController {
        require(servers[a]);
        delete servers[a];
        emit MailServerRemoved(a);
    }
    
    function exists(bytes a) external view returns (bool) {
        return servers[a];
    }
    
}
