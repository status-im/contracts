pragma solidity ^0.4.21;

import "../token/ERC20Token.sol";
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
contract MessageTribute is MessageSigned {

    event AudienceGranted(address indexed from, address indexed to, bool approve);

    struct Fee {
        uint256 amount;
        bool permanent;
    }
    mapping(bytes32 => bool) private granted;
    mapping(address => mapping(address => Fee)) public feeCatalog;
    mapping(address => mapping(address => uint)) lastAudienceDeniedTimestamp;
    
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
        Fee memory f = getFee(_from, msg.sender);
        fee = f.amount;
    }

    /**
     * @notice Approve/Deny chat request to `_to`
     * @param _approve Approve or deny request
     * @param _waive Refund deposit or not
     * @param _secret Captcha solution
     * @param _timeLimit time limit of audience request
     * @param _requesterSignature signature of Audience requestor
     * @param _grantorSignature signature of Audience grantor
     */
    function grantAudience(bool _approve, bool _waive, bytes32 _secret, uint256 _timeLimit, bytes _requesterSignature, bytes _grantorSignature) public {  
        require(_timeLimit <= block.timestamp);

        address grantor = recoverAddress(
            getSignHash(
                getGrantAudienceHash(
                    keccak256(_requesterSignature),
                    _approve,
                    _waive,
                    _secret
                )
            ),
            _grantorSignature
        );

        bytes32 hashedSecret = keccak256(grantor, _secret);
        require(!granted[hashedSecret]);
        granted[hashedSecret] = true;
        address requester = recoverAddress(
            getSignHash(
                getRequestAudienceHash(
                    grantor,
                    hashedSecret,
                    _timeLimit
                )
            ),
            _requesterSignature
        );
        
        require(lastAudienceDeniedTimestamp[grantor][requester] + 3 days <= now);
        if(!_approve)
            lastAudienceDeniedTimestamp[grantor][requester] = block.timestamp;

        uint256 amount = getFee(grantor, requester).amount;
        clearFee(grantor, requester);

        if (!_waive) {
            if (_approve) {
                require(token.transferFrom(requester, grantor, amount));
            }
        }
        emit AudienceGranted(grantor, requester, _approve);
    }

    function getGrantAudienceHash(
        bytes32 _requesterSignatureHash,
        bool _approve,
        bool _waive,
        bytes32 _secret
    ) 
        public
        view
        returns(bytes32)
    {
        return keccak256(
            address(this),
            bytes4(keccak256("grantAudience(bytes32,bool,bool,bytes32)")),
            _requesterSignatureHash,
            _approve,
            _waive,
            _secret
        );
    }

    function getRequestAudienceHash(
        address grantor,
        bytes32 hashedSecret,
        uint _timeLimit
    )
        public
        view
        returns(bytes32)
    {
        return keccak256(
            address(this),
            bytes4(keccak256("requestAudience(address,bytes32,uint256)")),
            grantor,
            hashedSecret,
            _timeLimit
        );
    }

    /**
     * @notice Obtain required fee to talk with `_from`
     * @param _from Account `msg.sender` wishes to talk to
     * @return Fee
     */
    function getFee(address _from, address _to) internal view
        returns (Fee) 
    {
        Fee memory specificFee = feeCatalog[_from][_to];
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