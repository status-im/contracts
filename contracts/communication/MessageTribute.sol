pragma solidity ^0.4.17;

import "../token/ERC20Token.sol";
import "../common/Controlled.sol";
import "../common/MessageSigned.sol";


/**
 * @title MessageTribute
 * @author Richard Ramos (Status Research & Development GmbH) 
 * @dev Inspired by one of Satoshi Nakamoto’s original suggested use cases for Bitcoin, 
        we will be introducing an economics-based anti-spam filter, in our case for 
        receiving messages and “cold” contact requests from users.
        token is deposited, and transferred from stakeholders to recipients upon receiving 
        a reply from the recipient.
 */
contract MessageTribute is Controlled, MessageSigned {

    event AudienceRequested(address indexed from, address indexed to);
    event AudienceCancelled(address indexed from, address indexed to);
    event AudienceTimeOut(address indexed from, address indexed to);
    event AudienceGranted(address indexed from, address indexed to, bool approve);

    struct Audience {
        uint256 blockNum;
        uint256 timestamp;
        Fee fee;
        bytes32 hashedSecret;
    }
    
    struct Fee {
        uint256 amount;
        bool permanent;
    }

    mapping(address => mapping(address => Audience)) audienceRequested;
    mapping(address => mapping(address => Fee)) public feeCatalog;
    mapping(address => mapping(address => uint)) lastAudienceDeniedTimestamp;
    
    ERC20Token public token;
    
     /**
     * @notice Contructor of MessageTribute
     * @param _token Address of Status Network Token (or any ERC20 compatible token)
     **/
    function MessageTribute(ERC20Token _token) public {
        token = _token;
    }
    
    /**
     * @notice Set tribute for accounts or everyone
     * @param _to Address to set the tribute. If address(0), applies to everyone
     * @param _amount Required tribute amount (using token from constructor)
     * @param _isPermanent Tribute applies for all communications on only for the first
     */
    function setRequiredTribute(address _to, uint _amount, bool _isPermanent) public {
        feeCatalog[msg.sender][_to] = Fee(_amount, _isPermanent);
    }
    
    /**
     * @notice Obtain amount of tokens required from `msg.sender` to contact `_from`
     * @return fee amount of tokens
     */
    function getRequiredFee(address _from) public view 
        returns (uint256 fee) 
    {
        Fee memory f = getFee(_from);
        fee = f.amount;
    }
    
    /**
     * @notice Send a chat request to `_from`, with a captcha that must be solved
     * @param _from Account to whom `msg.sender` requests a chat
     * @param _hashedSecret Captcha that `_from` must solve. It's a keccak256 of `_from`, 
     *                     `msg.sender` and the captcha value shown to `_from`
     */
    function requestAudience(address _from, bytes32 _hashedSecret)
        public 
    {
        Fee memory f = getFee(_from);
        require(f.amount <= token.allowance(msg.sender, address(this)));
        require(audienceRequested[_from][msg.sender].blockNum == 0);
        require(lastAudienceDeniedTimestamp[_from][msg.sender] + 3 days <= now);
        audienceRequested[_from][msg.sender] = Audience(block.number, now, f, _hashedSecret);
        emit AudienceRequested(_from, msg.sender);
    }

    /**
     * @notice Determine if there's a pending chat request between `_from` and `_to`
     * @param _from Account to whom `_to` had requested a chat
     * @param _to Account which requested a chat to `_from`
     */
    function hasPendingAudience(address _from, address _to) public view returns (bool) {
        return audienceRequested[_from][_to].blockNum > 0;
    }

    /**
     * @notice Can be called after 3 days if no response from `_from` is received
     * @param _from Account to whom `_to` had requested a chat
     * @param _to Account which requested a chat to `_from`
     */
    function timeOut(address _from, address _to) public {
        require(audienceRequested[_from][_to].blockNum > 0);
        require(audienceRequested[_from][_to].timestamp + 3 days <= now);
        uint256 amount = audienceRequested[_from][_to].fee.amount;
        delete audienceRequested[_from][_to];

        emit AudienceTimeOut(_from, _to);
    }

    /**
     * @notice Cancel chat request
     * @param _from Account to whom `msg.sender` had requested a chat previously
     */
    function cancelAudienceRequest(address _from) public {
        require(audienceRequested[_from][msg.sender].blockNum > 0);
        require(audienceRequested[_from][msg.sender].timestamp + 2 hours <= now);
        uint256 amount = audienceRequested[_from][msg.sender].fee.amount;
        delete audienceRequested[_from][msg.sender];
        emit AudienceCancelled(_from, msg.sender);
    }

    /**
     * @notice Approve/Deny chat request to `_to`
     * @param _approve Approve or deny request
     * @param _waive Refund deposit or not
     * @param _secret Captcha solution
     */
    function grantAudience(address _to, bool _approve, bool _waive, bytes32 _secret, bytes _grantorSignature) public {
        address grantor = recoverAddress(
            getSignHash(
                keccak256(
                    address(this),
                    bytes4(keccak256("grantAudience(address,bool,bool,bytes32)")),
                    _to,
                    _approve,
                    _waive,
                    _secret
                )
            ),
            _grantorSignature
        );

        Audience storage aud = audienceRequested[grantor][_to];

        require(aud.blockNum > 0);
        require(aud.hashedSecret == keccak256(grantor, _to, _secret));
       
        emit AudienceGranted(grantor, _to, _approve);

        if(!_approve)
            lastAudienceDeniedTimestamp[grantor][_to] = block.timestamp;

        uint256 amount = aud.fee.amount;

        delete audienceRequested[grantor][_to];

        clearFee(grantor, _to);

        if (!_waive) {
            if (_approve) {
                require(token.transferFrom(_to, grantor, amount));
            }
        }
    }

    /**
     * @notice Determine if msg.sender ha enough funds to chat with `_to`
     * @param _to Account `msg.sender` wishes to talk to
     * @return Has enough funds or not
     */
    function hasEnoughFundsToTalk(address _to)
        public
        view 
        returns(bool)
    {
        return getFee(_to).amount <= token.allowance(msg.sender, address(this));
    }

    /**
     * @notice Obtain required fee to talk with `_from`
     * @param _from Account `msg.sender` wishes to talk to
     * @return Fee
     */
    function getFee(address _from) internal view
        returns (Fee) 
    {
        Fee memory specificFee = feeCatalog[_from][msg.sender];
        Fee memory generalFee = feeCatalog[_from][address(0)];
        return specificFee.amount > 0 ? specificFee : generalFee;
    }

    /**
     * @notice Remove any tribute configuration between `_from` and `_to`
     * @param _from Owner of the configuration
     * @param _to Account that paid tributes (won't after this function is executed)
     */
    function clearFee(address _from, address _to) private {
        if (!feeCatalog[_from][_to].permanent) {
            feeCatalog[_from][_to].amount = 0;
            feeCatalog[_from][_to].permanent = false;
        }
    }
}