pragma solidity ^0.4.17;

import "../token/ERC20Token.sol";
import "../token/MiniMeTokenPreSigned.sol";
import "../token/MiniMeTokenPreSignedFactory.sol";
import "../token/ApproveAndCallFallBack.sol";

contract StatusActiveToken is MiniMeTokenPreSigned, ApproveAndCallFallBack {
    ERC20Token public snt;
    
    function StatusActiveToken(address _factory, address _snt)
        MiniMeTokenPreSigned(
            _factory,
            address(0),                     // parent token
            block.number,                       // snapshot block
            "Status Network Token",  // Token name
            18,                      // Decimals
            "SNT",                   // Symbol
            true                     // Enable transfers
        ) 
        public 
    {
        snt = ERC20Token(_snt);
    }

    function receiveApproval(address _from, uint256 _amount, address _token, bytes _data) public {
        require(msg.sender == _token);
        require(_token == address(snt));
        require(_amount > 0);
        require(_data.length == 0);
        activateSNT(_from, _amount);
    }

    function activateSNT(address _from, uint256 _amount) public {
        require(snt.transferFrom(_from, address(this), _amount));
        generateTokens(_from, _amount);
    }

    function deactivateSNT(uint256 _amount) public {
        _deactivateSNT(msg.sender, _amount);
    }

    function _deactivateSNT(address _from, uint256 _amount) private {
        require(balanceOf(msg.sender) >= _amount);
        require(snt.transfer(_from, _amount));
        destroyTokens(_from, _amount);
    }

}