pragma solidity >=0.5.0 <0.6.0;

import "../token/ERC20Token.sol";

contract TokenClaimer {
    event ClaimedTokens(address indexed _token, address indexed _controller, uint256 _amount);

    function claimTokens(address _token) external;
    /**
     * @notice This method can be used by the controller to extract mistakenly
     *  sent tokens to this contract.
     * @param _token The address of the token contract that you want to recover
     *  set to 0 in case you want to extract ether.
     */
    function withdrawBalance(address _token, address payable _destination)
        internal
    {
        uint256 balance;
        if (_token == address(0)) {
            balance = address(this).balance;
            address(_destination).transfer(balance);
        } else {
            ERC20Token token = ERC20Token(_token);
            balance = token.balanceOf(address(this));
            token.transfer(_destination, balance);
        }
        emit ClaimedTokens(_token, _destination, balance);
    }
}
