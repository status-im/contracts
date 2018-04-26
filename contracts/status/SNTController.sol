pragma solidity ^0.4.17;

import "../token/TokenController.sol";
import "../common/Owned.sol";
import "../common/MessageSigned.sol";
import "../token/ERC20Token.sol";
import "../token/MiniMeToken.sol";

/**
 * @title SNTController
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @notice enables economic abstraction for SNT
 */
contract SNTController is TokenController, Owned, MessageSigned {

    
    bytes4 public constant TRANSFER_PREFIX = bytes4(keccak256("transferSNT(address,uint256,uint256,uint256)"));
    bytes4 public constant EXECUTE_PREFIX = bytes4(keccak256("executeGasRelayed(address,bytes,uint256,uint256,uint256)"));

    MiniMeToken public snt;
    mapping (address => uint256) public signNonce;
    mapping (address => bool) public allowPublicExecution;
    
    event PublicExecutionEnabled(address indexed contractAddress, bool enabled);
    event GasRelayedExecution(address indexed msgSigner, bytes32 signedHash, bool executed);
    event ClaimedTokens(address indexed _token, address indexed _controller, uint256 _amount);
    event ControllerChanged(address indexed _newController);

    /**
     * @notice Constructor
     * @param _owner Authority address
     * @param _snt SNT token
     */
    function SNTController(address _owner, address _snt) public {
        owner = _owner;
        snt = MiniMeToken(_snt);
    }
    
    /** 
     * @notice allows externally owned address sign a message to transfer SNT and pay  
     * @param _to address receving the tokens from message signer
     * @param _amount total being transfered
     * @param _nonce current signNonce of message signer
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _signature concatenated rsv of message
     */
    function transferSNT(
        address _to,
        uint256 _amount,
        uint256 _nonce,
        uint256 _gasPrice,
        bytes _signature
    )
        external 
    {
        uint256 startGas = gasleft();
        bytes32 msgSigned = getSignHash(
            getTransferSNTHash(
                _to,
                _amount,
                _nonce,
                _gasPrice
            )
        );

        address msgSigner = recoverAddress(msgSigned, _signature);
        require(signNonce[msgSigner] == _nonce);
        signNonce[msgSigner]++;
        if (snt.transferFrom(msgSigner, _to, _amount)) {
            require(snt.transferFrom(msgSigner, msg.sender, (21000 + startGas-gasleft()) * _gasPrice));
        }
    }

    /**
     * @notice allows externally owned address sign a message to offer SNT for a execution 
     * @param _allowedContract address of a contracts in execution trust list;
     * @param _data msg.data to be sent to `_allowedContract`
     * @param _nonce current signNonce of message signer
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasMinimal minimal amount of gas needed to complete the execution
     * @param _signature concatenated rsv of message
     */
    function executeGasRelayed(
        address _allowedContract,
        bytes _data,
        uint256 _nonce,
        uint256 _gasPrice,
        uint256 _gasMinimal,
        bytes _signature
    )
        external
    {
        uint256 startGas = gasleft();
        require(startGas >= _gasMinimal);
        bytes32 msgSigned = getSignHash(
            getExecuteGasRelayedHash(
                _allowedContract,
                _data,
                _nonce,
                _gasPrice,
                _gasMinimal
            )
        );

        address msgSigner = recoverAddress(msgSigned, _signature);
        require(signNonce[msgSigner] == _nonce);
        signNonce[msgSigner]++;
        bool success = _allowedContract.call(_data);
        emit GasRelayedExecution(msgSigner, msgSigned, success);
        require(
            snt.transferFrom(
                msgSigner,
                msg.sender,
                (21000 + startGas-gasleft()) * _gasPrice
            )
        );   
    }

    /** 
     * @notice The owner of this contract can change the controller of the SNT token
     *  Please, be sure that the owner is a trusted agent or 0x0 address.
     *  @param _newController The address of the new controller
     */
    function changeController(address _newController) public onlyOwner {
        snt.changeController(_newController);
        emit ControllerChanged(_newController);
    }
    
    function enablePublicExecution(address _contract, bool _enable) public onlyOwner {
        allowPublicExecution[_contract] = _enable;
        emit PublicExecutionEnabled(_contract, _enable);
    }

    //////////
    // Safety Methods
    //////////

    /**
     * @notice This method can be used by the controller to extract mistakenly
     *  sent tokens to this contract.
     * @param _token The address of the token contract that you want to recover
     *  set to 0 in case you want to extract ether.
     */
    function claimTokens(address _token) public onlyOwner {
        if (snt.controller() == address(this)) {
            snt.claimTokens(_token);
        }
        if (_token == 0x0) {
            address(owner).transfer(this.balance);
            return;
        }

        ERC20Token token = ERC20Token(_token);
        uint256 balance = token.balanceOf(this);
        token.transfer(owner, balance);
        emit ClaimedTokens(_token, owner, balance);
    }


    //////////
    // MiniMe Controller Interface functions
    //////////

    // In between the offering and the network. Default settings for allowing token transfers.
    function proxyPayment(address) public payable returns (bool) {
        return false;
    }

    function onTransfer(address, address, uint256) public returns (bool) {
        return true;
    }

    function onApprove(address, address, uint256) public returns (bool) {
        return true;
    }

    /**
     * @notice get execution hash
     * @param _allowedContract address of a contracts in execution trust list;
     * @param _data msg.data to be sent to `_allowedContract`
     * @param _nonce current signNonce of message signer
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasMinimal minimal amount of gas needed to complete the execution
     */
    function getExecuteGasRelayedHash(
        address _allowedContract,
        bytes _data,
        uint256 _nonce,
        uint256 _gasPrice,
        uint256 _gasMinimal
    ) 
        public 
        view 
        returns (bytes32 execHash) 
    {
        execHash = keccak256(
            address(this),
            EXECUTE_PREFIX,
            _allowedContract,
            keccak256(_data),
            _nonce,
            _gasPrice,
            _gasMinimal
        );
    }

    /**
     * @notice get transfer hash
     * @param _to address receving the tokens from message signer
     * @param _amount total being transfered
     * @param _nonce current signNonce of message signer
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     */
    function getTransferSNTHash(
        address _to,
        uint256 _amount,
        uint256 _nonce,
        uint256 _gasPrice
    ) 
        public 
        view 
        returns (bytes32 txHash) 
    {
        txHash = keccak256(
            address(this),
            TRANSFER_PREFIX,
            _to,
            _amount,
            _nonce,
            _gasPrice
        );
    }
    
}