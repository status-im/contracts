pragma solidity >=0.5.0 <0.6.0;

import "../common/Controlled.sol";

/**
 * @title MessageTribute
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)* @
 * @notice User registry of Tribute to Talk manifests
 */
contract MessageTribute is Controlled {
    event Manifest(address indexed user, bytes manifest);
    event Stopped(bool stop);

    bool public stopped;
    mapping(address => bytes) private manifests;

    modifier notStopped {
        require(!stopped, "Contract disabled.");
        _;
    }
    /**
     * @param _defaultManifest contenthash manifest returned for unset/reset users 
     */
    constructor(bytes memory _defaultManifest) public {
        updateManifest(address(0), _defaultManifest);
    }

    /**
     * @notice Set public message
     * @param _manifest  contenthash manifest of Tribute to Talk
     */
    function setManifest(bytes calldata _manifest) external notStopped {
        updateManifest(msg.sender, _manifest);
    }

    /**
     * @notice Resets account to default manifest
     */
    function resetManifest() external notStopped {
        delete manifests[msg.sender];
        emit Manifest(msg.sender, new bytes(0));
    }

    /**
     * @notice controller can configure default fee
     * @param _defaultManifest contenthash manifest returned for unset/reset users 
     */
    function setDefaultManifest(bytes calldata _defaultManifest) external onlyController {
        updateManifest(address(0), _defaultManifest);
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
     * @notice Obtain public message content hash
     * @param _who Account reading the message from.
     * @return contenthash of user custom manifest, or if unset, default manifest
     */
    function getManifest(address _who) external view returns(bytes memory manifest) {
        manifest = manifests[_who];
        if(manifest.length == 0) {
            manifest = manifests[address(0)];
        }
    }

    /** 
     * @dev changes storage and fires event 
     * @param account account being changed, use address(0) for default manifest
     * @param manifest contenthash format data.
     */
    function updateManifest(address account, bytes memory manifest) internal {
        manifests[account] = manifest;
        emit Manifest(account, manifest);
    }

}