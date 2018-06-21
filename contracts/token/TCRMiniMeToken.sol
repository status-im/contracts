pragma solidity ^0.4.23;

import "./MiniMeToken.sol";

/**
 * @title 1:1 minime token to be used with TCRs
 * @dev This allows to have a token with shorter supply to simplify voting.
 */
contract TCRMiniMeToken is MiniMeToken {

    event TokensBought(address owner, uint amount);
    event TokensSold(address owner, uint amount);

    MiniMeToken token;

    constructor(
        MiniMeToken _token,
        address _tokenFactory,
        string _tokenName, 
        uint8 _decimalUnits, 
        string _tokenSymbol
    )
        MiniMeToken(_tokenFactory, address(0), 0, _tokenName, _decimalUnits, _tokenSymbol, true)
        public
    {
        require(_token != address(0));

        token = _token;
        basePrice = _basePrice;
        currentPrice = _basePrice;
    }

    function buy(uint256 _amount) 
        public  
        returns(bool)
    {
        require(token.allowance(msg.sender, address(this)) >= _amount);
        require(token.transferFrom(msg.sender, address(this), _amount));

        uint256 tokensBought = _amount; // TODO: calculate how much BCToken per baseToken

        emit TokensBought(msg.sender, tokensBought);

        // TODO: extracted from minimetoken, refactor
        uint curTotalSupply = totalSupplyAt(block.number);
        require(curTotalSupply + tokensBought >= curTotalSupply); // Check for overflow
        uint previousBalanceTo = balanceOfAt(msg.sender, block.number);
        require(previousBalanceTo + tokensBought >= previousBalanceTo); // Check for overflow
        updateValueAtNow(totalSupplyHistory, curTotalSupply + tokensBought);
        updateValueAtNow(balances[msg.sender], previousBalanceTo + tokensBought);

        return true;
    }

    function sell(uint256 _amount) 
        public 
        returns(bool) 
    {
    
        uint256 baseTokenAmount = _amount; // TODO: calculate how much baseTokens per token
    
        require(token.balanceOf(address(this)) >= baseTokenAmount);
        require(token.transfer(msg.sender, baseTokenAmount));

        emit TokensSold(msg.sender, _amount, currentPrice);

        // TODO: extracted from minime token, refactor
        uint curTotalSupply = totalSupplyAt(block.number);
        require(curTotalSupply >= _amount);
        uint previousBalanceFrom = balanceOfAt(msg.sender, block.number);
        require(previousBalanceFrom >= _amount);
        updateValueAtNow(totalSupplyHistory, curTotalSupply - _amount);
        updateValueAtNow(balances[msg.sender], previousBalanceFrom - _amount);

        return true;
    }
}