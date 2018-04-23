pragma solidity ^0.4.23;

import "./ERC20Token.sol";

contract StandardToken is ERC20Token {

    mapping (address => uint256) balances;
    mapping (address => mapping (address => uint256)) allowed;

    constructor() internal { }

    function transfer(
        address _to,
        uint256 _value
    ) 
        public 
        returns (bool success)
    {
        return transfer(msg.sender, _to, _value);    
    }

    function approve(address _spender, uint256 _value) 
        public
        returns (bool success) 
    {
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    )
        public
        returns (bool success)
    {
        if (balances[_from] >= _value &&
            allowed[_from][msg.sender] >= _value && 
            _value > 0) {
            allowed[_from][msg.sender] -= _value;
            return transfer(_from, _to, _value);
        } else { 
            return false; 
        }
    }

    function allowance(address _owner, address _spender) 
        public 
        view 
        returns (uint256 remaining)
    {
        return allowed[_owner][_spender];
    }

    function balanceOf(address _owner) 
        public 
        view 
        returns (uint256 balance) 
    {
        return balances[_owner];
    }

    function transfer(
        address _from, 
        address _to,
        uint256 _value
    )
        internal 
        returns (bool success)
    {
        if (balances[_from] >= _value && _value > 0) {
            balances[_from] -= _value;
            balances[_to] += _value;
            emit Transfer(_from, _to, _value);
            return true;
        } else { 
            return false; 
        }
    }


}
