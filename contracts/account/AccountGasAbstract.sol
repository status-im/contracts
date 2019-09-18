pragma solidity >=0.5.0 <0.6.0;

import "./ERC1271.sol";
import "../gasrelay/GasRelay.sol";
import "./Account.sol";


/**
 * @title AccountGasAbstract
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * @notice defines account gas abstract
 */
contract AccountGasAbstract is Account, ERC1271, GasRelay {

    enum OperationType {CALL, DELEGATECALL, CREATE, APPROVEANDCALL}

    modifier gasRelay(
        bytes memory _execData,
        uint _gasPrice,
        uint _gasLimit,
        address _gasToken,
        address payable _gasRelayer,
        bytes memory _signature
    ){
        //query current gas available
        uint startGas = gasleft();

        //verify transaction parameters
        require(startGas >= _gasLimit, ERR_BAD_START_GAS);

        //verify if signatures are valid and came from correct actor;
        require(
            isValidSignature(
                abi.encodePacked(
                    address(this),
                    _execData,
                    _gasPrice,
                    _gasLimit,
                    _gasToken
                ),
                _signature
            ) == MAGICVALUE,
            ERR_BAD_SIGNER
        );

        _;

        //refund gas used using contract held ERC20 tokens or ETH
        payGasRelayer(
            startGas,
            _gasPrice,
            _gasLimit,
            _gasToken,
            _gasRelayer
        );
    }

    /**
     * @notice include ethereum signed callHash in return of gas proportional amount multiplied by `_gasPrice` of `_gasToken`
     *         allows identity of being controlled without requiring ether in key balace
     * @param _to destination of call
     * @param _value call value (ether)
     * @param _data call data
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasLimit maximum gas of this transacton
     * @param _gasToken token being used for paying `_gasRelayer` (or msg.sender if relayer is 0)
     * @param _signature rsv concatenated ethereum signed message signatures required
     */
    function callGasRelay(
        address _to,
        uint256 _value,
        bytes calldata _data,
        uint _gasPrice,
        uint _gasLimit,
        address _gasToken,
        bytes calldata _signature
    )
        external
        gasRelay(
            abi.encodePacked(
                _to,
                _value,
                _data,
                nonce,
                msg.sender
            ),
            _gasPrice,
            _gasLimit,
            _gasToken,
            msg.sender,
            _signature
        )
    {
        _call(_to, _value,_data);
    }


    /**
     * @notice deploys contract in return of gas proportional amount multiplied by `_gasPrice` of `_gasToken`
     *         allows identity of being controlled without requiring ether in key balace
     * @param _value call value (ether) to be sent to newly created contract
     * @param _data contract code data
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasLimit maximum gas of this transacton
     * @param _gasToken token being used for paying `msg.sender`
     * @param _signature rsv concatenated ethereum signed message signatures required
     */
    function deployGasRelay(
        uint256 _value,
        bytes calldata _data,
        uint _gasPrice,
        uint _gasLimit,
        address _gasToken,
        bytes calldata _signature
    )
        external
        gasRelay(
            abi.encodePacked(
                _value,
                _data,
                nonce,
                msg.sender
            ),
            _gasPrice,
            _gasLimit,
            _gasToken,
            msg.sender,
            _signature
        )
    {
        _create(_value, _data);
    }

    /**
     * @notice include ethereum signed approve ERC20 and call hash
     *         (`ERC20Token(baseToken).approve(_to, _value)` + `_to.call(_data)`).
     *         in return of gas proportional amount multiplied by `_gasPrice` of `_baseToken`
     *         fixes race condition in double transaction for ERC20.
     * @param _baseToken token approved for `_to` and token being used for paying `msg.sender`
     * @param _to destination of call
     * @param _value call value (in `_baseToken`)
     * @param _data call data
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasLimit maximum gas of this transacton
     * @param _signature rsv concatenated ethereum signed message signatures required
     */
    function approveAndCallGasRelay(
        address _baseToken,
        address _to,
        uint256 _value,
        bytes calldata _data,
        uint _gasPrice,
        uint _gasLimit,
        bytes calldata _signature
    )
        external
        gasRelay(
            abi.encodePacked(
                _baseToken,
                _to,
                _value,
                _data,
                nonce,
                msg.sender
            ),
            _gasPrice,
            _gasLimit,
            _baseToken,
            msg.sender,
            _signature
        )
    {
        _approveAndCall(_baseToken, _to, _value, _data);
    }


    function executeSigned(
        address _to,
        uint256 _value,
        bytes memory _data,
        uint _nonce,
        uint _gasPrice,
        uint _gasLimit,
        address _gasToken,
        OperationType _operationType,
        bytes memory _signature
    )
        public
        gasRelay(
            abi.encodePacked(
                _to,
                _value,
                keccak256(_data),
                _nonce,
                _operationType
            ),
            _gasPrice,
            _gasLimit,
            _gasToken,
            msg.sender,
            _signature
        )
        returns (bytes32)
    {
        require(nonce == _nonce, ERR_BAD_NONCE);

        if(_operationType == OperationType.CALL){
            _call(_to, _value,_data);
        } else if(_operationType == OperationType.APPROVEANDCALL){
            _approveAndCall(_gasToken, _to, _value, _data);
        } else if(_operationType == OperationType.DELEGATECALL){
            nonce++;
            _to.delegatecall(_data);
        } else if(_operationType == OperationType.CREATE){
            _create(_value, _data);
        }
    }

    function canExecute(
        address _to,
        uint256 _value,
        bytes memory _data,
        uint _nonce,
        uint _gasPrice,
        uint _gasLimit,
        address _gasToken,
        OperationType _operationType,
        bytes memory _signature
    )
        public
        view
        returns (bool)
    {
        return (
            isValidSignature(
                abi.encodePacked(
                    address(this),
                    _to,
                    _value,
                    keccak256(_data),
                    _nonce,
                    _operationType,
                    _gasPrice,
                    _gasLimit,
                    _gasToken
                ),
                _signature
            ) == MAGICVALUE
        );

    }

}