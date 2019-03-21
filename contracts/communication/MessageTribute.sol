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
    event DefaultFee(uint256 value);
    event CustomFee(address indexed user, uint256 value);
    event PublicMessage(address indexed user, bytes message);
    event ResetFee(address indexed user);
    event Stopped(bool stop);

    struct Fee {
        bool custom;
        uint128 value; 
    }

    bool public stopped;
    uint256 public defaultValue;
    mapping(address => Fee) public feeCatalog;
    mapping(address => bytes) contenthash;

    modifier notStopped {
        require(!stopped, "Contract disabled.");
        _;
    }

    constructor(uint256 _defaultValue) public {
        defaultValue = _defaultValue;
        emit DefaultFee(_defaultValue);
    }

    /**
     * @notice Set tribute for everyone
     * @param _value Required tribute value 
     */
    function setRequiredTribute(uint256 _value) external notStopped {
        feeCatalog[msg.sender] = Fee(true, uint128(_value));
        emit CustomFee(msg.sender, _value);
    }


    /**
     * @notice Set tribute for everyone and public message
     * @param _value Required tribute value 
     * @param _contenthash Contenthash of Public Message
     */
    function setRequiredTribute(uint256 _value, bytes calldata _contenthash) external notStopped {
        feeCatalog[msg.sender] = Fee(true, uint128(_value));
        emit CustomFee(msg.sender, _value);
        contenthash[msg.sender] = _contenthash;
        emit PublicMessage(msg.sender, _contenthash);
    }

    /**
     * @notice Set public message
     * @param _contenthash Contenthash of Public Message
     */
    function updateMessage(bytes calldata _contenthash) external notStopped {
        contenthash[msg.sender] = _contenthash;
        emit PublicMessage(msg.sender, _contenthash);
    }

    /**
     * @notice Resets account params
     */
    function reset(bool value, bool message) external notStopped {
        if(value){
            delete feeCatalog[msg.sender];
            emit ResetFee(msg.sender);
        }
        if(message) {
            delete contenthash[msg.sender];
            emit PublicMessage(msg.sender, new bytes(0));
        }
        
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
     * @notice controller can stop the contract
     * @param _stop true disables alterting the contract
     */
    function setStopped(bool _stop) external onlyController {
        stopped = _stop;
        emit Stopped(_stop);
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

    /**
     * @notice Obtain public message content hash
     * @param _who Account reading the message from.
     * @return contenthash
     */
    function getContenthash(address _who) external view returns(bytes memory) {
        return contenthash[_who];
    }

}