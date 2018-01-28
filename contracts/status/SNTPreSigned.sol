pragma solidity ^0.4.11;

import "../token/MiniMeTokenPreSigned.sol";
import "../token/MiniMeTokenPreSignedFactory.sol";

/*
    Copyright 2017, Jarrad Hope (Status Research & Development GmbH)
*/

contract SNTPreSigned is MiniMeTokenPreSigned {
    // @dev SNT constructor just parametrizes the MiniMeIrrevocableVestedToken constructor
    function SNTPreSigned(address _newFactory, address _oldToken)
            MiniMeTokenPreSigned(
                _newFactory,
                _oldToken,                     // parent token
                block.number,                       // snapshot block
                "Status Network Token",  // Token name
                18,                      // Decimals
                "SNT",                   // Symbol
                true                     // Enable transfers
            ) 
                public 
            {

            }
}