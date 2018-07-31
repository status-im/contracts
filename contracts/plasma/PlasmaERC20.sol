pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";
import "../common/Owned.sol";
import "../token/ERC20Token.sol";

contract PlasmaERC20 is ERC721Token, Owned {

    address plasma;
    ERC20Token token;
    uint exchangeRate;

    constructor (address _plasma, 
                 address _token, 
                 uint _exchangeRate,
                 string _name, 
                 string _symbol
                 ) 
    ERC721Token(_name, _symbol)
    public {
        plasma = _plasma;
        token = ERC20Token(_token);
        exchangeRate = _exchangeRate;
    }

    mapping(uint => uint) ERC20Balances;
    
    function depositERC20() public {
        require(token.allowance(msg.sender, address(this)) >= exchangeRate);
        require(token.transferFrom(msg.sender, address(this), exchangeRate));

        uint256 tokenId = allTokens.length + 1;
        ERC20Balances[tokenId] = exchangeRate;
        _mint(msg.sender, tokenId);
    }

    function withdrawERC20(uint tokenId) public {
        require(ownerOf(tokenId) == msg.sender);
        uint erc20Value = ERC20Balances[tokenId];
        ERC20Balances[tokenId] = 0;
        _burn(msg.sender, tokenId);
        require(token.transferFrom(address(this), msg.sender, erc20Value));
    }

    function depositToPlasmaWithData(uint tokenId, bytes _data) public {
        require(plasma != address(0));
        safeTransferFrom(
            msg.sender,
            plasma,
            tokenId,
            _data);
    }

    function depositToPlasma(uint tokenId) public {
        require(plasma != address(0));
        safeTransferFrom(msg.sender, plasma, tokenId);
    }

    function setExchangeRate(uint _newRate) onlyOwner public {
        exchangeRate = _newRate;
    }

}