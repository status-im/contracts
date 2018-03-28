pragma solidity ^0.4.21;

import "../common/Controlled.sol";
import "../token/ERC20Token.sol";
import "../token/MiniMeToken.sol";

/**
 * @title FeeRecycler
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmBH)
 * @dev Allow user selecting predefined destinations to where this fees will be invested
 */
contract FeeRecycler is Controlled {

    //allowed democratically choosen destinations
    mapping (address => bool) public destinations;
    //balances of users
    mapping (address => uint256) public balances;
    //used for withdrawing lost tokens
    uint256 public totalLocked;
    //base token
    MiniMeToken public token;

    /**
     * @notice Constructor defines the unchangable (?) baseToken
     * @param _token base token
     */
    function FeeRecycler(MiniMeToken _token) public {
        token = _token;
    }

    /** 
     * @notice Lock a fee in name of someone
     * @param _from who would be able to recycle this funds
     * @param _amount to be locked
     */
    function lock(address _from, uint256 _amount) external {
        require(token.transferFrom(msg.sender, address(this), _amount));
        balances[_from] += _amount;
        totalLocked += _amount;
    }

    /** 
     * @notice Unlock and approveAndCall 
     * @param _to Allowed destination to get tokens
     * @param _amount that will be transfered
     */
    function recycle(address _to, uint256 _amount) external {
        require(destinations[_to]);
        require(balances[msg.sender] >= _amount);
        balances[msg.sender] -= _amount;
        totalLocked -= _amount;
        token.approveAndCall(_to, _amount, new bytes(0));
    }

    /** 
     * @notice Controller should enable destinations to recycle
     * @param _destination that would be available to recycle
     * @param _allowed users can recycle to this address?
     */
    function setDestination(address _destination, bool _allowed)
        external 
        onlyController
    {
        destinations[_destination] = _allowed;
    }

    /** 
     * @notice Withdraw lost tokens in the contract
     * @param _token if is base token than can only transfer unlocked amount
     * @param _destination address receiving this tokens
     * @param _amount the amount to be transfered
     */
    function withdraw(ERC20Token _token, address _destination, uint256 _amount) 
        external 
        onlyController
    {
        if (address(_token) == address(token)) {
            require(_amount <= _token.balanceOf(address(this)) - totalLocked);
        } else if (address(_token) == address(0)) {
            require(this.balance <= _amount);
        } 
        if (address(_token) != address(0)) {
            _token.transfer(_destination, _amount);
        } else {
            _destination.transfer(_amount);
        }
    }

}