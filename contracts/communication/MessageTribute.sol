pragma solidity >=0.5.0 <0.6.0;

import "../common/Controlled.sol";

/**
 * @notice Defines tribute to talk
 */
contract MessageTribute is Controlled {
    event SetTribute(address indexed account, uint256 value);
    bool public stopped;
    mapping(address => uint256) tributeCatalog;

    /**
     * @notice Set tribute of account
     * @param _value Required tribute value
     */
    function setTribute(uint256 _value) external {
         setTribute(msg.sender, _value);
    }

    /**
     * @notice Stops the contract of being able to change values.
     */
    function setStopped(bool _stopped) external onlyController {
        stopped = _stopped;
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

    /**
     * @notice Changes tribute of account
     * @param _of Account chaning tribute
     * @param _value New tribute value
     */
    function setTribute(address _of, uint256 _value) internal {
        require(!stopped, "Contract stopped by Controller");
        tributeCatalog[_of] = _value;
        emit SetTribute(_of, _value);
    }

}