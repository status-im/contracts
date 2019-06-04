pragma solidity >=0.5.0 <0.6.0;

import "./StatusNetwork.sol";
/**
 * @title SNTController
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * @notice Test net version of SNTController which allow public mint
 */
contract TestStatusNetwork is StatusNetwork {

    bool public open = false;

    /**
     * @notice Constructor
     * @param _owner Authority address
     * @param _snt SNT token
     */
    constructor(address payable _owner, MiniMeToken _snt)
        public
        StatusNetwork(_owner, _snt)
    { }

    function () external {
        _generateTokens(msg.sender, 1000 * (10 ** uint(snt.decimals())));
    }

    function mint(uint256 _amount) external {
        _generateTokens(msg.sender, _amount);
    }

    function generateTokens(address _who, uint _amount) external {
        _generateTokens(_who, _amount);
    }

    function destroyTokens(address _who, uint _amount) external onlyOwner {
        snt.destroyTokens(_who, _amount);
    }

    function setOpen(bool _open) external onlyOwner {
        open = _open;
    }

    function _generateTokens(address _who, uint _amount) private {
        require(msg.sender == owner || open, "Test Mint Disabled");
        address statusNetwork = snt.controller();
        if(statusNetwork == address(this)){
            snt.generateTokens(_who, _amount);
        } else {
            TestStatusNetwork(statusNetwork).generateTokens(_who, _amount);
        }

    }


}