pragma solidity >=0.5.0 <0.6.0;

import "../token/ERC20Token.sol";
import "../common/Controlled.sol";


contract VisibilityStake is Controlled {

    struct Stake {
        uint256 amount;
        uint256 time;
    }

    ERC20Token public token;
    uint256 public lockDelay;
    mapping(bytes32 => uint256) public visibility;
    mapping(address => mapping (bytes32 => Stake)) public stake;
    
    constructor(ERC20Token _token, uint256 _lockDelay) public {
        token = _token;
        lockDelay = _lockDelay;
    }

    function deposit(bytes32 _publicKeyHash, uint256 _amount) external {
        require(token.transferFrom(msg.sender, address(this), _amount), "Transfer error");
        visibility[_publicKeyHash] += _amount;
        stake[msg.sender][_publicKeyHash].amount += _amount;
        stake[msg.sender][_publicKeyHash].time = now;

    }

    function withdraw(bytes32 _publicKeyHash) external {
        uint256 time = stake[msg.sender][_publicKeyHash].time = now;
        uint256 amount = stake[msg.sender][_publicKeyHash].amount;
        require(time != 0 && time > now + lockDelay, "Locked stake");
        delete stake[msg.sender][_publicKeyHash];
        if(amount == 0) {
            return;
        }
        require(visibility[_publicKeyHash] > amount, "Not available");
        visibility[_publicKeyHash] -= amount;
    }
    
    function slash(bytes32 _publicKeyHash) external onlyController {
        uint256 amount = visibility[_publicKeyHash];
        delete visibility[_publicKeyHash];
        require(token.transferFrom(address(this), msg.sender, amount), "Transfer error");
    }

}