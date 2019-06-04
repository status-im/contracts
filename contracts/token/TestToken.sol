pragma solidity >=0.5.0 <0.6.0;

import "./StandardToken.sol";

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
}
