pragma solidity >=0.5.0 <0.6.0;
import "../common/MessageSigned.sol";

/**
 * @notice Defines tribute to talk
 */
contract MessageTribute is MessageSigned {
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
     * @notice Set tribute of account using signature
     * @param _value Required tribute value
     * @param _ttl TTL of message
     * @param _messageSignature signature of hashTributeMessage(_value, _ttl)
     */
    function setTribute(uint256 _value, uint256 _ttl, bytes calldata _messageSignature) external {
        uint256 time = block.timestamp;
        require(time < _ttl && _ttl-time < 1 days, "Invalid TTL");
        address signer = recoverAddress(getSignHash(hashTributeMessage(_value, _ttl)), _messageSignature);
        require(signer != address(0), "Invalid signer");
        tributeCatalog[signer] = _value;
        emit SetTribute(signer, _value);
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
     * @notice generates hash for signing tributes
     * @param _value Required tribute value
     * @param _ttl TTL of message
     */
    function hashTributeMessage(uint256 _value, uint256 _ttl) public view returns(bytes32) {
        return keccak256(abi.encodePacked(address(this), _value, _ttl));
    }

}