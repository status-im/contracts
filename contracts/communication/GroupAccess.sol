pragma solidity ^0.4.24;

import "../token/ERC20Token.sol";
import "../common/MessageSigned.sol";


contract GroupSuscription is MessageSigned {

    struct SuscriptionData {
        uint256 amount;
        uint256 recurrency;
        uint256 amountHeld;
        bool requiresPayment;
    }

    mapping(bytes32 => uint) private suscriptions;
    mapping(bytes32 => address) private groupOwnership;
    mapping(bytes32 => SuscriptionData) private groupSuscriptionInfo;

    event GroupSetup(bytes groupKey, bytes32 groupId);
    
    ERC20Token public token;
    
    constructor(ERC20Token _token) public {
        token = _token;
    }
    
    function registerGroup(bytes _groupKey, 
                           uint256 _amount, 
                           uint256 _recurrency, 
                           uint256  _amountHeld, 
                           bool _requiresPayment) public {
        bytes32 groupId = keccak256(abi.encodePacked(address(this), msg.sender, _groupKey));
        groupOwnership[groupId] = msg.sender;
        groupSuscriptionInfo[groupId] = SuscriptionData(_amount, _recurrency, _amountHeld, _requiresPayment);
        emit GroupSetup(_groupKey, groupId);
    }

    function getSuscriptionInfo(bytes32 groupId) public view 
        returns (uint256 amount, uint256 recurrency, uint256 amountHeld bool requiresPayment) 
    {
        SuscriptionData memory susc = groupSuscriptionInfo[groupId];
        return (susc.amount, susc.recurrency, susc.amountHeld, susc.requiresPayment);
    }

    function canParticipate(bytes32 _groupId) public view
        returns (bool)
    {
        bytes32 suscriptionHash = getSuscriptionHash(_groupId);
        
        SuscriptionData memory susc = groupSuscriptionInfo[_groupId];
        if(token.balanceOf(msg.sender) < susc.amountHeld){
            return false;
        }

        return suscriptions[suscriptionHash] > block.timestamp;
    }

    function suscribe(bytes32 _groupId) public {
        SuscriptionData memory susc = groupSuscriptionInfo[_groupId];
        bytes32 suscriptionHash = getSuscriptionHash(_groupId);

        if(susc.requiresPayment){
            require(token.transferFrom(msg.sender, groupOwnership[_groupId], susc.amount));
        }

        if(susc.amountHeld > 0)
            require(token.balanceOf(msg.sender) >= susc.amountHeld);

        suscriptions[suscriptionHash] = now + susc.recurrency;
    }

    function getSuscriptionHash(bytes32 _groupId) 
        public 
        view 
        returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                address(this),
                msg.sender,
                bytes4(keccak256("suscribe(bytes32)")),
                _groupId
            )
        );
    }

}