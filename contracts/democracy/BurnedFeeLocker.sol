pragma solidity ^0.4.17;

import "../token/MiniMeToken.sol";
import "../token/ApproveAndCallFallBack.sol";

contract BurnedFeeLocker is ApproveAndCallFallBack {

    address public SNT;
    address public recyclerManager;
    mapping (address => uint256) burnedFee;
    uint256 availableToRecycle;

    function BurnedFeeLocker(address _recyclerManager, address _SNT) public { 
        SNT = _SNT;
        recyclerManager = _recyclerManager;
    }

    function recycleFee(address _from, address _to, uint256 _amount) external {
        require(msg.sender == recyclerManager);
        require(burnedFee[_from] >= _amount);
        MiniMeToken(SNT).approveAndCall(_to, _amount, new bytes(0));
        availableToRecycle -= _amount;
    }

    function withdrawToken(address _token, address _to) external {
        require(msg.sender == recyclerManager);
        uint256 available = MiniMeToken(_token).balanceOf(address(this));
        if (_token == SNT) {
            available -= availableToRecycle;
        }
        if (available > 0) {
            MiniMeToken(_token).transfer(_to, available);
        }
    }

    function receiveApproval(address _from, uint256 _amount, address _token, bytes _data) public {
        require(_token == SNT);
        if (_amount == 0 || _data.length > 0) {
            require(msg.sender == _token);
        }
        if (MiniMeToken(SNT).transferFrom(_from, address(this), _amount)) {
            burnedFee[_from] += _amount;
            availableToRecycle += _amount;
        }
    }
}