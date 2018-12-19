pragma solidity >=0.5.0 <0.6.0;

import "../common/Controlled.sol";

/**
 * @title MessageTribute
 * @author Richard Ramos (Status Research & Development GmbH) 
 *         Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * @dev Inspired by one of Satoshi Nakamoto’s original suggested use cases for Bitcoin, 
        we will be introducing an economics-based anti-spam filter, in our case for 
        receiving messages and “cold” contact requests from users.
        token is deposited, and transferred from stakeholders to recipients upon receiving 
        a reply from the recipient.
 */
contract MessageTribute is Controlled {
    event DefaultFee(uint256 _value);
    event CustomFee(address indexed _user, uint256 _value);
    event ResetFee(address indexed _user);

    struct Fee {
        bool custom;
        uint128 value; 
    }

    uint256 public defaultValue;
    mapping(address => Fee) public feeCatalog;

    constructor(uint256 _defaultValue) public {
        defaultValue = _defaultValue;
        emit DefaultFee(_defaultValue);
    }

    /**
     * @notice Set tribute for accounts or everyone
     * @param _value Required tribute value (using token from constructor)
     */
    function setRequiredTribute(uint256 _value) external {
        feeCatalog[msg.sender] = Fee(true, uint128(_value));
        emit CustomFee(msg.sender, _value);
    }

    /**
     * @notice Reset to default value
     */
    function reset() external {
        delete feeCatalog[msg.sender];
        emit ResetFee(msg.sender);
    }
    

    /** @notice controller can configure default fee
     *  @param _defaultValue fee for unset or reseted users. 
     */
    function setDefaultValue(uint256 _defaultValue) external onlyController {
        defaultValue = _defaultValue;
        emit DefaultFee(_defaultValue);
    }

    /**
     * @notice Obtain required fee to talk with `_to`
     * @param _to Account `msg.sender` wishes to talk to
     * @return Fee
     */
    function getFee(address _to) public view
        returns (uint256) 
    {
        Fee storage fee = feeCatalog[_to];
        return fee.custom ? uint256(fee.value) : defaultValue;
    }

}