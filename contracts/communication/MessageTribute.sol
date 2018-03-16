pragma solidity ^0.4.17;

import "../common/Controlled.sol";
import "../token/MiniMeToken.sol";


/**
 * @title MessageTribute
 * @author Richard Ramos (Status Research & Development GmbH) 
 * @dev Inspired by one of Satoshi Nakamoto’s original suggested use cases for Bitcoin, 
        we will be introducing an economics-based anti-spam filter, in our case for 
        receiving messages and “cold” contact requests from users.
        SNT is deposited, and transferred from stakeholders to recipients upon receiving 
        a reply from the recipient.
 */
contract MessageTribute is Controlled {

    MiniMeToken public SNT;

    struct Fee {
        uint256 amount;
        bool tribute;
        bool permanent;
    }

    mapping(address => mapping(address => Fee)) feeCatalog;
    mapping(address => uint256) balances;

    struct Audience {
        uint256 blockNum;
        Fee fee;
    }

    mapping(address => mapping(address => Audience)) audienceRequested;
    

    function MessageTribute(address _SNT) public {
        SNT = MiniMeToken(_SNT);
    }

    function setRequiredTribute(address _to, uint _amount, bool _isTribute, bool _isPermanent) public {
        feeCatalog[msg.sender][_to] = Fee(_amount, _isTribute, _isPermanent);
    }

    function getRequiredFee(address _from) public view 
        returns (uint256 fee, bool tribute) 
    {
        Fee memory f = getFee(_from);
        fee = f.amount;
        tribute = f.tribute;
    }

    function getFee(address _from) internal 
        returns (Fee) 
    {
        Fee memory generalFee  = feeCatalog[_from][address(0)];
        Fee memory specificFee = feeCatalog[_from][msg.sender];
        return specificFee.amount > 0 ? specificFee : generalFee;
    }
    

    function deposit(uint256 _value) public {
        require(_value > 0);
        balances[msg.sender] += _value;
        require(SNT.transferFrom(msg.sender, this, _value));
    }

    function balance() public view returns (uint256) {
        return balances[msg.sender];
    }

    function withdraw(uint256 _value) public {
        require(balances[msg.sender] > 0);
        require(_value <= balances[msg.sender]);
        require(SNT.transferFrom(msg.sender, this, _value));
    }

    event AudienceRequested(address from, address to);
    event AudienceCancelled(address from, address to);
    event AudienceGranted(address from, address to, bool approve);

    function requestAudience(address _from)
        public 
    {
        Fee memory f = getFee(_from);
        require(f.amount <= balances[msg.sender]);
        require(audienceRequested[_from][msg.sender].blockNum == 0);
        
        AudienceRequested(_from, msg.sender);
        audienceRequested[_from][msg.sender] = Audience(block.number, f);
        balances[msg.sender] -= f.amount;
    }

    function cancelAudienceRequest(address _from) public {
        if (audienceRequested[_from][msg.sender].blockNum > 0) {
            AudienceCancelled(_from, msg.sender);
            balances[msg.sender] += audienceRequested[_from][msg.sender].fee.amount;
            delete audienceRequested[_from][msg.sender];
        }
    }

    function grantAudience(address _to, bool _approve) {

        Audience memory aud = audienceRequested[msg.sender][_to];

        require(aud.blockNum > 0);
       
        AudienceGranted(msg.sender, _to, _approve);

        bool isTribute = aud.fee.tribute;
        uint256 amount = aud.fee.amount;

        delete audienceRequested[msg.sender][_to];
        clearFee(msg.sender, _to);

        if (isTribute) {
            if (_approve) {
                require(SNT.transferFrom(this, msg.sender, amount));  
            } else {
                balances[_to] += amount;
            }
        }
    }

    function hasEnoughFundsToTalk(address _to)
        public
        view 
        returns(bool)
    {
        return getFee(_to).amount <= balances[msg.sender];
    }

    function clearFee(address _from, address _to) private {
        if (!feeCatalog[_from][_to].permanent) {
            feeCatalog[_from][_to].amount = 0;
            feeCatalog[_from][_to].tribute = false;
            feeCatalog[_from][_to].permanent = false;
        }
    }
    
}
