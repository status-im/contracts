pragma solidity >=0.5.0 <0.6.0;

import "./AccountGasAbstract.sol";;
import "./ERC725.sol";

/**
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * @notice Defines an account which can be setup by a owner address (multisig contract), recovered by a recover address (a sort of secret multisig contract), and execute actions from a list of addresses (authorized contracts, extensions, etc)
 */
contract Identity is AccountGasAbstract, ERC725 {
    uint256 constant OPERATION_CALL = 0;
    uint256 constant OPERATION_CREATE = 1;
    mapping(bytes32 => bytes) store;

    ERC1271 public owner;
    address public recoveryContract;
    bool public actorsEnabled;
    address[] public actors;
    mapping(address => bool) public isActor;

    modifier management {
        require(msg.sender == address(owner) || msg.sender == address(this), "Unauthorized");
        _;
    }

    modifier recovery {
        require(recoveryContract == address(0) && (msg.sender == address(this) || msg.sender == address(owner)) || msg.sender == recoveryContract, "Unauthorized");
        _;
    }

    modifier authorizedAction(address _to) {
        require((actorsEnabled && isActor[msg.sender] && _to != address(this)) || msg.sender == address(owner), "Unauthorized");
        _;
    }

    /**
     * @notice Defines recoveryContract address.
     * @param _recovery address of recoveryContract contract
     */
    function setRecovery(address _recovery)
        external
        recovery
    {
        recoveryContract = _recovery;
    }

    function recoverAccount(ERC1271 newOwner)
        external
        recovery
    {
        owner = newOwner;
        actorsEnabled = false;
    }

    function setData(bytes32 _key, bytes calldata _value)
        external
        management
    {
        store[_key] = _value;
        emit DataChanged(_key, _value);
    }

    function setActorsEnabled(bool _actorsEnabled)
        external
        management
    {
        actorsEnabled = _actorsEnabled;
    }

    function addActor(address newActor)
        external
        management
    {
        require(!isActor[newActor], "Already defined");
        actors.push(newActor);
        isActor[newActor] = true;
    }

    function removeActor(uint256 index)
        external
        management
    {
        uint256 lastPos = actors.length-1;
        require(index <= lastPos, "Index out of bounds");
        address removing = actors[index];
        isActor[removing] = false;
        if(index != lastPos){
            actors[index] = actors[lastPos];
        }
        actors.length--;
    }

    function changeOwner(ERC1271 newOwner)
        external
        management
    {
        require(address(newOwner) != address(0), "Bad parameter");
        owner = newOwner;
    }

    function execute(
        uint256 _operationType,
        address _to,
        uint256 _value,
        bytes calldata _data
    )
        external
        authorizedAction(_to)
    {
        if (_operationType == OPERATION_CALL) {
            _call(_to, _value, _data);
        } else if (_operationType == OPERATION_CREATE) {
            require(_to == address(0), "Bad parameter");
            _create(_value, _data);
        } else {
            revert("Unsupported");
        }
    }

    function approveAndCall(
        address _baseToken,
        address _to,
        uint256 _value,
        bytes calldata _data
    )
        external
        authorizedAction(_to)
    {
        _approveAndCall(_baseToken, _to, _value, _data);
    }

    function getData(bytes32 _key)
        external
        view
        returns (bytes memory _value)
    {
        return store[_key];
    }

    function isValidSignature(
        bytes memory _data,
        bytes memory _signature
    )
        public
        view
        returns (bytes4 magicValue)
    {
        return owner.isValidSignature(_data, _signature);
    }


}