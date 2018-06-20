pragma solidity ^0.4.23;

import "./MiniMeToken.sol";


contract BondedCurveMiniMeToken is MiniMeToken {

    event TokensBought(address owner, uint amount, uint price);
    event TokensSold(address owner, uint amount, uint price);

    MiniMeToken token;

    uint256 basePrice;
    uint256 currentPrice;

    constructor(
        MiniMeToken _token,
        uint256 _basePrice,
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

        uint256 tokensBought = 1; // TODO: calculate how much BCToken per token
        currentPrice = 1; // TODO: calculate price

        emit TokensBought(msg.sender, tokensBought, currentPrice);

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
    
        uint256 baseTokenAmount = 1; // TODO: calculate how much baseTokens per token
        currentPrice = 1; // TODO: calculate price    
    
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