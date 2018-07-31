pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";
import "../common/Owned.sol";
import "../token/ERC20Token.sol";

contract PlasmaERC20 is ERC721Token, Owned {

    address plasma;
    ERC20Token token;
    mapping(uint8 => uint) exchangeRate;

    constructor (address _plasma, 
                 address _token, 
                 string _name, 
                 string _symbol
                 ) 
    ERC721Token(_name, _symbol)
    public {
        plasma = _plasma;
        token = ERC20Token(_token);
    }

    mapping(uint => uint8) NFTTypes;
    mapping(uint => uint) ERC20Balances;
    

    // TODO: this is only for the demo. Remove
    function register() external {
        // Give each new player 5 cards
        for (int j = 0; j < 5; j++) {
            uint256 tokenId = allTokens.length + 1;
            _mint(msg.sender, tokenId);
        }
    }


    function depositERC20(uint8 _NFTType) public {
        uint rate = exchangeRate[_NFTType];

        require(rate > 0);
        require(token.allowance(msg.sender, address(this)) >= rate);
        require(token.transferFrom(msg.sender, address(this), rate));

        uint256 tokenId = allTokens.length + 1;
        ERC20Balances[tokenId] = rate;
        NFTTypes[tokenId] = _NFTType;

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

    function setExchangeRate(uint _newRate, uint8 _NFTType) onlyOwner public {
        exchangeRate[_NFTType] = _newRate;
    }

}