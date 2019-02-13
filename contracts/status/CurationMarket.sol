pragma solidity >=0.5.0 <0.6.0;

import "../common/Controlled.sol";
import "../token/ERC20Token.sol";
import "./Ranking.sol";

contract CurationMarket is Controlled {
    ERC20Token token;
    Ranking ranking = new Ranking();
    
    constructor(ERC20Token _token) public {
        token = _token;
    }

    function register(bytes32 _uid, address _owner, uint256 _points, bytes32 _before) external {
        require(token.transferFrom(msg.sender, address(this), _points), "Bad transfer");
        ranking.include(_uid, _owner, _points, _before);
    }

    function increase(bytes32 _uid, uint256 _points, bytes32 _oldPrevious, bytes32 _newPrevious) external {
        require(token.transferFrom(msg.sender, address(this), _points), "Bad transfer");
        ranking.increase(_uid, _points, _oldPrevious, _newPrevious);
    }

    function decrease(bytes32 _uid, uint256 _points, bytes32 _oldPrevious, bytes32 _newPrevious) external {
        uint256 cost = (_points * 6) / 10; //TODO: bound curve
        require(token.transfer(Controlled(address(token)).controller(), _points-cost), "Bad transfer");
        require(token.transferFrom(msg.sender, ranking.ownerOf(_uid), cost), "Bad transfer");
        ranking.decrease(_uid, _points, _oldPrevious, _newPrevious);
    }

    function migrate(address destination) external onlyController {
        require(destination != address(0), "Bad destination");
        require(token.transfer(destination, token.balanceOf(address(this))), "Bad transfer");
        ranking.changeController(destination);
    }   
}
