# Identity contracts

#### Summary
This is a proposed proof of concept for the implementation of interfaces [ERC-725](https://github.com/ethereum/EIPs/issues/725) and [ERC735](https://github.com/ethereum/EIPs/issues/725), providing the following functionality:
- Public key register, composed of Ethereum Addresses and ECDSA keys. These keys can perform management activities over the identity itself, as well as performing operations in other contracts and transfer of ether.
- Claim holding, that can be used to add / verify claims against an identity.
- Identity factory to simplify the process of instantiating an Identity contract, as well as handling the upgrade process of this instance, assuming there's a new version of this contract.
- Identity recovery process that can be initiated using a shared secret among keys related to the identity.

#### Smart Contracts Overview
###### `Controlled`
Keeps tracks of the controller or owner of the contract. Provides the modifier `onlyController` which can be used in child contracts.

###### `DelegatedCall`
Abstract contract that delegates calls using the `delegated` modifier to the result of `targetDelegatedCall()` function.

###### `InstanceStorage`
Defines kernel vars that an `IdentityKernel` contract share with a `Instance` contract. If you wish to reuse this contract, it is important to avoid overwriting wrong storage pointers, so `InstanceStorage` should be always the first contract to be inherited.

###### `Instance`
Contract that forwards everything through `delegatecall` to a defined `IdentityKernel`. This contracts inherits from `InstanceStorage` and `DelegatedCall`

###### `UpdatableInstance`
A contract that can be updated, if the contract itself calls `updateUpdatableInstance()`. This contract inherits from `Instance`

###### `DelayedUpdatableInstanceStorage`
This contract defines kernel vars that an `IdentityKernel` contract shares with and `Instance`. See `InstanceStorage` fro restrictions in case of reuse. This contract inherits from `InstanceStorage`

###### `DelayedUpdatableInstance`
Extending the functionality of `UpdatableInstance`, this contract introduces a delay functionality based in the `block.timestamp` in order to limit updates with a 30 days lock. 

###### `Factory`
Contract used as a version control for `IdentityKernel` contracts

###### `ERC725` and `ERC735`
Interfaces based on EIPs [ERC-725: Identity](https://github.com/ethereum/EIPs/issues/725) and [ERC735: Claims Holder](https://github.com/ethereum/EIPs/issues/725)

###### `Identity`
Implementation of ERC725 and ERC735. Includes additional management functions to handle minimum required approvals for execution of transactions, as well as recovery related functions.

###### `IdentityKernel`
Represents a version of the identity contract that can be created with the `IdentityFactory`, as well as be updated with calls to itself. This contract inherits from `DelayedUpdatableInstanceStorage` and `Identity`

###### `FriendsRecovery`
Contract that handles the recovery process of an `Identity` in case the management keys are lost, or were compromised. A `FriendsRecovery` contract instance has an 1:1 association with an `Identity`

###### `IdentityFactory`
Factory pattern implementation for handling `IdentityKernel` instance generation.

#### Use

##### Identity Creation
Lorem Ipsum

##### Executions and Approvals
Lorem Ipsum

##### Management Activities
Lorem Ipsum

##### Register a new `IdentityKernel` version
Lorem Ipsum

##### Upgrade an `IdentityKernel` instance 
Lorem Ipsum

##### Identity Recovery
Lorem Ipsum



