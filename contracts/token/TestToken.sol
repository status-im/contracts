pragma solidity ^0.4.23;

import "./StandardToken.sol";
import './ApproveAndCallFallBack.sol';

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

    function approveAndCall(address _spender, uint256 _amount, bytes _extraData) returns (bool success) {
      if (!approve(_spender, _amount)) throw;
      ApproveAndCallFallBack(_spender).receiveApproval(
          msg.sender,
          _amount,
          this,
          _extraData
       );
      return true;
    }

}
