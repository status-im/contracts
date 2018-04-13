pragma solidity ^0.4.17;

import "../token/MiniMeToken.sol";
import "../common/Controlled.sol";

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
    mapping(bytes32 => uint256) private friendIndex;
    mapping(address => uint256) public balances;
    address[] private friends; 
    
    MiniMeToken public SNT;
    
    function MessageTribute(MiniMeToken _SNT) public {
        SNT = _SNT;
    }

    function addFriends(address[] _friends) public {
        uint256 len = _friends.length;
        for (uint256 i = 0; i < len; i++) {
            bytes32 frHash = keccak256(_friends[i], msg.sender);
            if (friendIndex[frHash] == 0)
                friendIndex[frHash] = friends.push(_friends[i]);
        }
    }

    function removeFriends(address[] _friends) public {
        uint256 len = _friends.length;
        for (uint256 i = 0; i < len; i++) {
            bytes32 frHash = keccak256(_friends[i], msg.sender);
            require(friendIndex[frHash] > 0);
            uint index = friendIndex[frHash] - 1;
            delete friendIndex[frHash];
            address replacer = friends[friends.length - 1];
            friends[index] = replacer;
            friendIndex[keccak256(replacer, msg.sender)] = index;
            friends.length--;
        }
    }

    function areFriends(address sourceAccount, address accountToCheck) public view returns(bool) {
        return friendIndex[keccak256(accountToCheck, sourceAccount)] > 0;
    }

    function setRequiredTribute(address _to, uint _amount, bool _isPermanent) public {
        require(friendIndex[keccak256(msg.sender, _to)] == 0);
        feeCatalog[msg.sender][_to] = Fee(_amount, _isPermanent);
    }

    function getRequiredFee(address _from) public view 
        returns (uint256 fee) 
    {
        Fee memory f = getFee(_from);
        fee = f.amount;
    }
    
    function deposit(uint256 _value) public {
        require(_value > 0);
        balances[msg.sender] += _value;
        require(SNT.transferFrom(msg.sender, address(this), _value));
    }

    function balance() public view returns (uint256) {
        return balances[msg.sender];
    }

    function withdraw(uint256 _value) public {
        require(balances[msg.sender] > 0);
        require(_value <= balances[msg.sender]);
        balances[msg.sender] -= _value;
        require(SNT.transfer(msg.sender, _value)); 
    }

    function requestAudience(address _from, bytes32 hashedSecret)
        public 
    {
        Fee memory f = getFee(_from);
        require(f.amount <= balances[msg.sender]);
        require(audienceRequested[_from][msg.sender].blockNum == 0);
        require(lastAudienceDeniedTimestamp[_from][msg.sender] + 3 days <= now);

        emit AudienceRequested(_from, msg.sender);
        audienceRequested[_from][msg.sender] = Audience(block.number, now, f, hashedSecret);

        balances[msg.sender] -= f.amount;
    }

    function hasPendingAudience(address _from, address _to) public view returns (bool) {
        return audienceRequested[_from][_to].blockNum > 0;
    }

    function timeOut(address _from, address _to) public {
        require(audienceRequested[_from][_to].blockNum > 0);
        require(audienceRequested[_from][_to].timestamp + 3 days <= now);
        emit AudienceTimeOut(_from, _to);
        balances[_to] += audienceRequested[_from][_to].fee.amount;
        delete audienceRequested[_from][_to];
    }

    function cancelAudienceRequest(address _from) public {
        require(audienceRequested[_from][msg.sender].blockNum > 0);
        require(audienceRequested[_from][msg.sender].timestamp + 2 hours <= now);
        emit AudienceCancelled(_from, msg.sender);
        balances[msg.sender] += audienceRequested[_from][msg.sender].fee.amount;
        delete audienceRequested[_from][msg.sender];
    }

    function grantAudience(address _to, bool _approve, bool _waive, bytes32 secret) public {
        Audience storage aud = audienceRequested[msg.sender][_to];

        require(aud.blockNum > 0);
        require(aud.hashedSecret == keccak256(msg.sender, _to, secret));
       
        emit AudienceGranted(msg.sender, _to, _approve);

        if(!_approve)
            lastAudienceDeniedTimestamp[msg.sender][_to] = block.timestamp;

        uint256 amount = aud.fee.amount;

        delete audienceRequested[msg.sender][_to];

        clearFee(msg.sender, _to);

        if (!_waive) {
            if (_approve) {
                require(SNT.transfer(msg.sender, amount));
            } else {
                balances[_to] += amount;
            }
        } else {
            balances[_to] += amount;
        }
    }

    function hasEnoughFundsToTalk(address _to)
        public
        view 
        returns(bool)
    {
        return getFee(_to).amount <= balances[msg.sender];
    }

    function getFee(address _from) internal view
        returns (Fee) 
    {
        Fee memory specificFee = feeCatalog[_from][msg.sender];

        if (friendIndex[keccak256(msg.sender, _from)] > 0)
            return Fee(0, false);

        Fee memory generalFee = feeCatalog[_from][address(0)];
        return specificFee.amount > 0 ? specificFee : generalFee;
    }

    function clearFee(address _from, address _to) private {
        if (!feeCatalog[_from][_to].permanent) {
            feeCatalog[_from][_to].amount = 0;
            feeCatalog[_from][_to].permanent = false;
        }
    }
}