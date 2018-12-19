pragma solidity >=0.5.0 <0.6.0;

import "../common/Controlled.sol";
import "../common/MessageSigned.sol";
import "../token/ERC20Token.sol";

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
contract MessageTribute is Controlled, MessageSigned {
    event DefaultFee(uint256 _value);
    event CustomFee(address indexed _user, uint256 _value);
    event ResetFee(address indexed _user);
    event AudienceGranted(address indexed _from, address _to);
    struct Fee {
        bool custom;
        uint128 value; 
    }

    uint256 public defaultValue;
    ERC20Token token;
    mapping(address => Fee) public feeCatalog;

    constructor(uint256 _defaultValue, ERC20Token _token) public {
        token = _token;
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
     * @notice Pays Tribute, needs to be called by audience requestor. Compatible with approveAndCall.
     * @param _to Address granting audience and getting paid
     * @param _ttl Audience grantor TTL signature
     * @param _signature Audience grantor signature accepting tribute
     */
    function sendTribute(address _to, uint256 _value, uint256 _ttl, bytes calldata _signature) external {
        require(now < _ttl, "TTL expired");
        require(
            _to == recoverAddress(
                getSignHash(
                    keccak256(
                        abi.encodePacked(
                            address(this),
                            msg.sender,
                            _ttl
                        )
                    )
                ), 
                _signature
            ),
            "Invalid signature"
        );
        require(_value >= getFee(msg.sender), "Too low value");
        require(token.transferFrom(msg.sender, _to, _value), "Transfer failed");
        emit AudienceGranted(_to, msg.sender);
    }

    /**
     * @notice Receives Tribute, needs to be called by audience grantor. 
     * Requestor needs to approve spending by this contract first.
     * @param _from Address paying the tribute
     * @param _ttl signature TTL
     * @param _value amount being paid
     * @param _signature Audience requestor signature accepting tribute
     */
    function receiveTribute(address _from, uint256 _value, uint256 _ttl, bytes calldata _signature) external {
        require(now < _ttl, "TTL expired");
        require(
            _from == recoverAddress(
                getSignHash(
                    keccak256(
                        abi.encodePacked(
                            address(this),
                            msg.sender,
                            _value,
                            _ttl
                        )
                    )
                ), 
                _signature
            ),
            "Invalid signature"
        );
        require(_value >= getFee(msg.sender), "Too low value");
        require(token.transferFrom(_from, msg.sender, _value), "Transfer failed");
        emit AudienceGranted(msg.sender, _from);
    }

    /**
     * @notice Reset to default value
     */
    function reset() external {
        delete feeCatalog[msg.sender];
        emit ResetFee(msg.sender);
    }
    
    /**
     * @notice controller can configure default fee
     * @param _defaultValue fee for unset or reseted users. 
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