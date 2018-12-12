pragma solidity >=0.5.0 <0.6.0;

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
contract MessageTribute  {

    event AudienceGranted(address indexed from, address to);

    mapping(address => mapping(address => uint256)) public feeCatalog;
    
    ERC20Token public token;
    
     /**
     * @notice Contructor of MessageTribute
     * @param _token Address of Status Network Token (or any ERC20 compatible token)
     **/
    constructor(ERC20Token _token) public {
        token = _token;
    }
    
    /**
     * @notice Set tribute for accounts or everyone
     * @param _to Address to set the tribute. If address(0), applies to everyone
     * @param _amount Required tribute amount (using token from constructor)
     */
    function setRequiredTribute(address _to, uint _amount) external {
        feeCatalog[msg.sender][_to] = _amount;
    }
    
    /**
     * @notice Pay tribute to talk
     */
    function payTribute(address _to) external {  
        address requester = msg.sender;
        uint256 amount = getFee(_to, requester);
        delete feeCatalog[_to][requester];
        require(token.transferFrom(requester, _to, amount), "Transfer fail");
        emit AudienceGranted(_to, requester);
    }

    /**
     * @notice Obtain required fee to talk with `_from`
     * @param _from Account `msg.sender` wishes to talk to
     * @return Fee
     */
    function getFee(address _from, address _to) public view
        returns (uint256) 
    {
        uint256 specificFee = feeCatalog[_from][_to];
        uint256 generalFee = feeCatalog[_from][address(0)];
        return specificFee > 0 ? specificFee : generalFee;
    }

}