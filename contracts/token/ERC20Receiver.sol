pragma solidity ^0.4.23;

import "./ERC20Token.sol";

contract ERC20Receiver {

    event TokenDeposited(address indexed token, address indexed sender, uint256 amount);
    event TokenWithdrawn(address indexed token, address indexed sender, uint256 amount);

    mapping (address => mapping(address => uint256)) tokenBalances;

    constructor() public {
        
    }

    function depositToken(
        ERC20Token _token
    )
        external
    {
        _depositToken(
            msg.sender,
            _token,
            _token.allowance(
                msg.sender, 
                address(this)
            )
        );
    }

    function withdrawToken(
        ERC20Token _token,
        uint256 _amount
    )
        external 
    {
        _withdrawToken(msg.sender, _token, _amount);
    }

    function depositToken(
        ERC20Token _token,
        uint256 _amount
    ) 
        external
    {
        require(_token.allowance(msg.sender, address(this)) >= _amount);
        _depositToken(msg.sender, _token, _amount);
    }

    function tokenBalanceOf(
        ERC20Token _token,
        address _from
    )
        external 
        view 
        returns(uint256 fromTokenBalance) 
    {
        return tokenBalances[address(_token)][_from];
    }

    function _depositToken(
        address _from,
        ERC20Token _token,
        uint256 _amount
    )
        private 
    {
        require(_amount > 0);
        if (_token.transferFrom(_from, address(this), _amount)) {
            tokenBalances[address(_token)][_from] += _amount;
            emit TokenDeposited(address(_token), _from, _amount);
        }
    }

    function _withdrawToken(
        address _from,
        ERC20Token _token,
        uint256 _amount
    )
        private
    {
        require(_amount > 0);
        require(tokenBalances[address(_token)][_from] >= _amount);
        tokenBalances[address(_token)][_from] -= _amount;
        require(_token.transfer(_from, _amount));
        emit TokenWithdrawn(address(_token), _from, _amount);
    }

    
}