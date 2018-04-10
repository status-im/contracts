pragma solidity ^0.4.21;

contract TestIdentityGasRelay {
    event Debug();
    
    function approveAndCallGasRelayed(
        address _baseToken, 
        address _to,
        uint256 _value,
        bytes _data,
        uint _nonce,
        uint _gasPrice,
        uint _gasMinimal,
        address _gasToken,
        bytes _messageSignatures
    ) external {
        emit Debug();
    }

    function callGasRelayed(
        address _to,
        uint256 _value,
        bytes _data,
        uint _nonce,
        uint _gasPrice,
        uint _gasMinimal,
        address _gasToken, 
        bytes _messageSignatures
    ) external { 
        emit Debug();
    }

    function() payable {
        
    }
}

contract TestIdentityFactory {
    address public latestKernel;
    function TestIdentityFactory(){
        latestKernel = address(new TestIdentityGasRelay());
    }

    
}

contract TestSNTController {
    event Debug();
    function transferSNT(address a,uint256 b,uint256 c,uint256 d, bytes f){
        emit Debug();
    } 
    function executeGasRelayed(address a,bytes b,uint256 c,uint256 d,uint256 e,bytes f){
        emit Debug();
    }
}