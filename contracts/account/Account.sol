pragma solidity >=0.5.0 <0.6.0;

import "../token/ERC20Token.sol";

/**
 * @notice Uses ethereum signed messages
 */
contract Account {

    event Executed(uint256 nonce, bool success, bytes returndata);
    event Deployed(uint256 nonce, bool success, address returnaddress);
    string internal constant ERR_BAD_TOKEN_ADDRESS = "Bad token address";
    string internal constant ERR_BAD_DESTINATION = "Bad destination";

    uint256 public nonce;
    constructor() internal {}

    function _call(
        address _to,
        uint256 _value,
        bytes memory _data
    )
        internal
        returns (uint256 _nonce)
    {
        bool success;
        bytes memory returndata;
        _nonce = nonce++; // Important: Must be incremented always BEFORE external call
        (success,returndata) = _to.call.value(_value)(_data); //external call
        emit Executed(_nonce, success, returndata);
    }

    /**
     * @notice creates new contract based on input `_code` and transfer `_value` ETH to this instance
     * @param _value amount ether in wei to sent to deployed address at its initialization
     * @param _code contract code
     */
    function _create(
        uint _value,
        bytes memory _code
    )
        internal
        returns (uint256 _nonce)
    {
        address createdContract;
        bool failed;
        _nonce = nonce++; // Important: Must be incremented always BEFORE deploy
        assembly {
            createdContract := create(_value, add(_code, 0x20), mload(_code)) //deploy
            failed := iszero(extcodesize(createdContract))
        }
        emit Deployed(_nonce, !failed, createdContract);
    }

    function _approveAndCall(
        address _baseToken,
        address _to,
        uint256 _value,
        bytes memory _data
    )
        internal
        returns (uint256 _nonce)
    {
        bool success;
        bytes memory returndata;
        _nonce = nonce++; // Important: Must be incremented always BEFORE external call
        require(_baseToken != address(0), ERR_BAD_TOKEN_ADDRESS); //_baseToken should be something!
        require(_to != address(0) && _to != address(this), ERR_BAD_DESTINATION); //need valid destination
        ERC20Token(_baseToken).approve(_to, _value); //external call
        (success,returndata) = _to.call.value(_value)(_data); //external call
        emit Executed(_nonce, success, returndata);
    }

}