pragma solidity ^0.4.17;


/*
Inspired by one of Satoshi Nakamoto’s original suggested use cases for Bitcoin, 
we will be introducing an economics-based anti-spam filter, in our case for 
receiving messages and “cold” contact requests from users.
SNT is deposited, and transferred from stakeholders to recipients upon receiving 
a reply from the recipient.
 */

 // Uses:

    /*
    // B will request 100SNT from everyone for messages 
    feeCatalog[B_ADDRESS][address(0)] = 100
    */

    /*
    // A wants to send a message to B
    // B requires that A pays 100SNT
    feeCatalog[B_ADDRESS][A_ADDRESS] = 100;
    ---------------------------------------
    // A will check if B has a fee set up
    bool hasFee = feeCatalog[B_ADDRESS][address(0)] > 0 || feeCatalog[B_ADDRESS][A_ADDRESS] > 0
    if(hasFee){
        uint256 fee = feeCatalog[B_ADDRESS][address(0)];
        if(feeCatalog[B_ADDRESS][A_ADDRESS] > fee)
            fee = feeCatalog[B_ADDRESS][A_ADDRESS];
    }
    ---------------------------------------
    A will pay or decide to not send the message

    ---------------------------------------

    // B wants a non permanent fee for A
    // After he pays for the first message, 
    // All following messages will be free
    permanentFee[B_ADDRESS][A_ADDRESS] = false;

    Then after applying fee, we should set:
    feeCatalog[B_ADDRESS][A_ADDRESS] = 0;
   
    ---------------------------------------

    // B wants a permanent fee for A 
    permanentFee[B_ADDRESS][A_ADDRESS] = true;

    */
contract MessageTribute {

    struct Request {
        address from;
        address to;
        uint256 timestamp;
    }

    mapping(address => mapping(address => uint256)) feeCatalog;
    mapping(address => mapping(address => bool)) permanentFee;

    function MessageTribute() public {

    }

    

    
}
