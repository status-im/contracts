# Identity contracts

# Table of content
- [Summary](#summary)
- [Smart Contracts Overview](#smart-contracts-overview)
- [Tutorials](#tutorials)
- - [Identity Creation](#identity-creation)

## Summary
This is a proposed proof of concept for the implementation of interfaces [ERC-725](https://github.com/ethereum/EIPs/issues/725) and [ERC735](https://github.com/ethereum/EIPs/issues/725), providing the following functionality:
- Public key register, composed of Ethereum Addresses and ECDSA keys. These keys can perform management activities over the identity itself, as well as performing operations in other contracts and transfer of ether.
- Claim holding, that can be used to add / verify claims against an identity.
- Identity factory to simplify the process of instantiating an Identity contract, as well as handling the upgrade process of this instance, assuming there's a new version of this contract.
- Identity recovery process that can be initiated using a shared secret among keys related to the identity.

## Smart Contracts Overview
- `Controlled`. Keeps tracks of the controller or owner of the contract. Provides the modifier `onlyController` which can be used in child contracts.
- `DelegatedCall`. Abstract contract that delegates calls using the `delegated` modifier to the result of `targetDelegatedCall()` function.
- `InstanceStorage`. 
Defines kernel vars that an `IdentityKernel` contract share with a `Instance` contract. If you wish to reuse this contract, it is important to avoid overwriting wrong storage pointers, so `InstanceStorage` should be always the first contract to be inherited.
- `Instance`. Contract that forwards everything through `delegatecall` to a defined `IdentityKernel`. This contracts inherits from `InstanceStorage` and `DelegatedCall`
- `UpdatableInstance`. A contract that can be updated, if the contract itself calls `updateUpdatableInstance()`. This contract inherits from `Instance`
- `DelayedUpdatableInstanceStorage`. This contract defines kernel vars that an `IdentityKernel` contract shares with and `Instance`. See `InstanceStorage` fro restrictions in case of reuse. This contract inherits from `InstanceStorage`
- `DelayedUpdatableInstance`. Extending the functionality of `UpdatableInstance`, this contract introduces a delay functionality based in the `block.timestamp` in order to limit updates with a 30 days lock. 
- `Factory`. Contract used as a version control for `IdentityKernel` contracts
- `ERC725` and `ERC735`. Interfaces based on EIPs [ERC-725: Identity](https://github.com/ethereum/EIPs/issues/725) and [ERC735: Claims Holder](https://github.com/ethereum/EIPs/issues/725)
- `Identity`. Implementation of ERC725 and ERC735. Includes additional management functions to handle minimum required approvals for execution of transactions, as well as recovery related functions.
- `IdentityKernel`. Represents a version of the identity contract that can be created with the `IdentityFactory`, as well as be updated with calls to itself. This contract inherits from `DelayedUpdatableInstanceStorage` and `Identity`
- `FriendsRecovery`. Contract that handles the recovery process of an `Identity` in case the management keys are lost, or were compromised. A `FriendsRecovery` contract instance has an 1:1 association with an `Identity`
- `IdentityFactory`. Factory pattern implementation for handling `IdentityKernel` instance generation.

## Tutorials

### Identity Creation
We recommend to not create `Identity` instances directly, but create them through the `IdentityFactory` which is deployed in: `0x000000000000000000000000`, and provides the following functions:
- `createIdentity()` - will create a new instance of an `IdentityKernel`, with `msg.sender` as a management key.
- `createIdentity(address _idOwner)` - used to specify the owner / management key of a new identity.

The event `IdentityCreated` is triggered when the new identity is created successfully.

### Executions and Approvals


### Management Activities
Identity management is limited to the addition, removal and setting of the minimum required approvals to perform a transaction. These activities will fall into the approval process requiring that N managers approve their execution before it is performed.
- `addKey(bytes32 _key, uint256 _purpose, uint256 _type)`. Registers a key in the identity. Keys should have a defined purpose and type. The `_purpose` of a key can be `1` - Management keys, used only to perform management activities; `2` - Action keys, used only to perform calls to external contracts and sending ether; `3` - Claim signer key, which are keys that can add claims to the identity; and `4` - Encryption keys, at the moment used only for information purposes. The `_type` of keys supported at the moment are `0` for ethereum addresses, `1` for ECDSA. Keys are stored as a bytes32 value. Both `_purpose` and `_type` accepts `uint256` types, so they're not limited to the values described in here. It is worth mentioning that keys can have more than one purpose and `addKey` can be called for the same key more than once, assuming the purpose is different each time it is called. Triggers a `KeyAdded` event.
- `removeKey(bytes32 _key, uint256 _purpose)`. Used to remove an existing key-purpose pair. It will fail if you're removing a management key, and there is only one management key registered in the identity. Triggers a `KeyRemoved` event.
- `replaceKey(bytes32 _oldKey, bytes32 _newKey, uint256 _newType)`. Used to replace an existing key, for a new one that can have a different type. Triggers both a `KeyRemoved` and `KeyAdded` event.
- `setMinimumApprovalsByKeyType(uint256 _purpose, uint256 _minimumApprovals)`. By default, an `Identity` has only one management key registered (the owner of the identity), however it is possible to have more than one management key registered with `addKey`, and require a N of M approvals (both for Management and Action keys). This is done with this function, where you have to specify number of minimum approvals required by key purpose.

### Claims
Lorem Ipsum

### Management Activities
Lorem Ipsum

### Constants / View functions

### Adding new functionality
Lorem Ipsum

### Register a new `IdentityKernel` version
Lorem Ipsum

### Upgrade an `IdentityKernel` instance 
Lorem Ipsum

### Identity Recovery
Lorem Ipsum



