pragma solidity >=0.5.0 <0.6.0;

import "../token/TokenController.sol";
import "../common/Owned.sol";
import "../common/TokenClaimer.sol";
import "../token/ERC20Token.sol";
import "../token/MiniMeToken.sol";
/**
 * @title SNTController
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * @notice enables economic abstraction for SNT
 */
contract SNTController is TokenController, Owned, TokenClaimer {

    MiniMeToken public snt;

    event ClaimedTokens(address indexed _token, address indexed _controller, uint256 _amount);
    event ControllerChanged(address indexed _newController);

    /**
     * @notice Constructor
     * @param _owner Authority address
     * @param _snt SNT token
     */
    constructor(address payable _owner, MiniMeToken _snt) internal {
        if(_owner != address(0)){
            owner = _owner;
        }
        snt = _snt;
    }
    /**
     * @notice The owner of this contract can change the controller of the SNT token
     *  Please, be sure that the owner is a trusted agent or 0x0 address.
     *  @param _newController The address of the new controller
     */
    function changeController(address  payable _newController) public onlyOwner {
        snt.changeController(_newController);
        emit ControllerChanged(_newController);
    }

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
        withdrawBalance(_token, owner);
    }

    /**
     * @notice payment by address coming from controlled token
     * @dev In between the offering and the network. Default settings for allowing token transfers.
     */
    function proxyPayment(address) external payable returns (bool) {
        //Uncomment above line when using parameters
        //require(msg.sender == address(snt), "Unauthorized");
        return false;
    }

    /**
     * @notice register and authorizes transfer from token
     * @dev called by snt when a transfer is made
     */
    function onTransfer(address, address, uint256) external returns (bool) {
        //Uncomment above line when using parameters
        //require(msg.sender == address(snt), "Unauthorized");
        return true;
    }

    /**
     * @notice register and authorizes approve from token
     * @dev called by snt when an approval is made
     */
    function onApprove(address, address, uint256) external returns (bool) {
        //Uncomment above line when using parameters
        //require(msg.sender == address(snt), "Unauthorized");
        return true;
    }
}