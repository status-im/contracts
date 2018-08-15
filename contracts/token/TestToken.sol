pragma solidity ^0.4.23;

import "./StandardToken.sol";
import './ApprovalReceiver.sol';

/**
 * @notice ERC20Token for test scripts, can be minted by anyone.
 */
contract TestToken is StandardToken {

    constructor() public { }

    /**
     * @notice any caller can mint any `_amount`
     * @param _amount how much to be minted
     */
    function mint(uint256 _amount) public {
        mint(msg.sender, _amount);
    }

    function approveAndCall(address _spender, uint256 _value, bytes _extraData) returns (bool success) {
      assert(approve(_spender, _value));
      return ApprovalReceiver(_spender).receiveApproval(msg.sender, _value, this, _extraData);
    }

}
