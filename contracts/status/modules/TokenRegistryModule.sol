pragma solidity ^0.4.17;

import "../ConstitutionModule.sol";
import "../../registry/TokenRegistry.sol";

contract TokenRegistryModule is ConstitutionModule {
    
    function install() external {
        TokenRegistry tokenReg = new TokenRegistry();
        bytes32 rootTokenReg = keccak256(address(tokenReg));
        trustNet.addTopic(rootTokenReg, 0x0);
        trustNet.addTopic(keccak256(address(tokenReg), bytes4(keccak256("addToken(address,string,string,uint8,bytes,bytes)"))), rootTokenReg);
        trustNet.addTopic(keccak256(address(tokenReg), bytes4(keccak256("removeToken(address,uint256)"))), rootTokenReg);
    }

    
}