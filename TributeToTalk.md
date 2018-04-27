# Tribute to Talk - contracts

## Table of content
- [Summary](#summary)
- [Smart Contracts Overview](#smart-contracts-overview)
- [Tutorials](#tutorials)
- - [Contract deployment](#contract-deployment)
- - [Setting up a tribute](#setting-up-a-tribute0)
- - [Verifying if a tribute is required](#verifying-if-a-tribute-is-required)
- - [Sending a chat request](#sending-a-chat-request)
- - [Deciding the outcome of a chat request](#deciding-the-outcome-of-a-chat-request)
- - [Closing the tribute ceremony](#closing-the-tribute-ceremony)

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

### Sending a chat request
If a fee is required, an asym key whisper message with an specific topic needs to be send to the receiver, indicating that a chat request has been made. (No SNT is deducted at the moment). This whisper message would need to include the requester signature, the requestor address, the unhashed secret phrase, and a time limit.

To build the requester signature, a hash needs to be created using the function: 
```
function getRequestAudienceHash(address _grantor, bytes32 _hashedSecret, uint _timeLimit) public view returns(bytes32)
``` 
#### Parameters
- `_grantor`: Address of the user you wish to contact
- `_hashedSecret`: The hash of a secret phrase (can be the hash of a captcha value)
- `_timeLimit`: Time limit for the chat request to be approved

After obtaining the request audience hash, it needs to be signed with `web3.eth.sign` to obtain the signature

### Deciding the outcome of a chat request
After the whisper message from the requestor is received, the receiver needs to make a decision: will he approve or deny the chat request, and if he approves it, will he waive the SNT amount? All these decisions need to be sent back via whisper to the requestor, including among these values the grantor signature, generated with this function

To build the grantor signature, a hash needs to be created using the function: 
```
function getGrantAudienceHash(bytes32 _requesterSignatureHash, bool _approve, bool _waive, bytes32 _secret) public view returns (bytes32)
``` 
#### Parameters
- `_requesterSignatureHash`: Keccak256 of the requester signature
- `_approve`: Indicates if the chat request is approved or not
- `_waive`: If chat request is approved, indicate if you wish to waive the token deposit
- `_secret`: Unhashed secret phrase. (Received via whisper)

After obtaining the grant audience hash, it needs to be signed with `web3.eth.sign` by the receiver to obtain the signature, then it will be sent back to the requester along with the approve and waive decisions.

### Closing the tribute ceremony
After the requestor receives a whisper message from the receiver, `grantAudience` will be invoked with the required values that both the requester and the receiver shared:

```
function grantAudience(bool _approve, bool _waive, bytes32 _secret, uint256 _timeLimit, bytes _requesterSignature, bytes _grantorSignature) public
```

This function generates an event `AudienceRequested` which depending of the approve/waive indicates that the transfer of tokens was realized successfully.
