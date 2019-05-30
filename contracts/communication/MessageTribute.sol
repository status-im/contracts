pragma solidity >=0.5.0 <0.6.0;

/**
 * @notice Defines tribute to talk
 */
contract MessageTribute {
    event SetTribute(address indexed account, uint256 value);

    mapping(address => uint256) private tributeCatalog;

    /**
     * @notice Set tribute of account
     * @param _value Required tribute value
     */
    function setTribute(uint256 _value) external {
        tributeCatalog[msg.sender] = _value;
        emit SetTribute(msg.sender, _value);
    }

    /**
     * @notice Obtain required tribute to talk with `_of`
     * @param _of Account to lookup
     * @return value of tribute
     */
    function getTribute(address _of) external view
        returns (uint256)
    {
        return tributeCatalog[_of];
    }

}