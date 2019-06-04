pragma solidity >=0.5.0 <0.6.0;

import "./MessageTribute.sol";

/**
 * @notice Defines migration contract of MessageTribute
 */
contract MessageTributeMigrated is MessageTribute {
    mapping(address => bool) private migrated;
    MessageTribute public previousVersion;

    /**
     * @notice Defines the previous contract to load unset users
     * @param _previousVersion Contract to read unset tributes
     */
    constructor(MessageTribute _previousVersion) public {
        require(address(_previousVersion) != address(0), "Previous version not provided");
        previousVersion = _previousVersion;
    }
    /**
     * @notice Obtain required tribute to talk with `_of` from `previousVersion` if `_of` never set on this one
     * @param _of Account to lookup
     * @return value of tribute
     */
    function getTribute(address _of) external view
        returns (uint256)
    {
        return migrated[_of] ? tributeCatalog[_of] : previousVersion.getTribute(_of);
    }

    function setTribute(address _of, uint256 _value) internal {
        migrated[_of] = true;
        super.setTribute(_of, _value);
    }

}