# Tribute to Talk - contracts

## Table of content
- [Summary](#summary)
- [Smart Contracts Overview](#smart-contracts-overview)
- [Tutorials](#tutorials)
- - [Contract deployment](#contract-deployment)
- - [Setting up a tribute](#setting-up-a-tribute0)
- - [Verifying if a tribute is required](#erifying-if-a-tribute-is-required)

## Summary
Inspired by one of Satoshi Nakamoto’s original suggested use cases for Bitcoin, this contract introduces an economics-based anti-spam filter, in our case for receiving messages and “cold” contact requests from users. Token is transferred from stakeholders to recipients upon receiving a reply from the recipient.

## Smart Contracts Overview
- `MessageSigned`. Helper functions for handling signatures, and recovering addresses
- `MessageTribute`. Implementation of the idea. This contract inherits from the `MessageSigned` contract, and handles the business logic behind the contract requests and token transfers. 

## Tutorials

### Contract deployment
Contract deployment is an activity that will be performed before the 'Tribute to Talk' functionality is included in the Status App. Deployment of this contract requires knowing beforehand the address of the token contract to be used (STT for testnets, SNT for mainnet)

The contract is available in the following chains:
- Ropsten: 0x000000000000000000000000
- Kovan: 0x000000000000000000000000
- Mainnet: 0x000000000000000000000000

### Setting up a tribute

When a user wishes to receive an amount of tokens for contact requests the function `setRequiredTribute` needs to be used.


This function can be used to act as a spam blocking mechanism. Status won't have direct blocking of the users. Only economic barriers. If you wish to block someone, require a high enough tribute, and you won't receive chat requests. 

```
function setRequiredTribute(address _to, uint _amount, bool _isPermanent) public
```

#### Parameters 
- `_to`: Address from which a tribute to talk will be required. If the tribute is going to apply to every address in the network, you can use `0x0`
- `_amount`: Required tribute amount (using the token specified in the contract constructor).
- `_isPermanent`: Determines if the tribute will apply to all chat requests received from an address, or only for the first chat request.

### Verifying if a tribute is required
A user that wishes to talk with another user not on their contact list needs to verify if a tribute is required or not through the use of the `getRequiredFee` function which will return the amount in tokens that needs to be paid for creating a chat request.
```
function getRequiredFee(address _from) public view returns (uint256 fee) 
``` 
#### Parameters
- `_from`: Address that might or might not have a tribute required for the `msg.sender`. If returns a value greater than `0`, it means there's a tribute set.

