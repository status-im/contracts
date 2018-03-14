# Identity contracts

# Table of content
- [Summary](#summary)
- [Smart Contracts Overview](#smart-contracts-overview)
- [Tutorials](#tutorials)
- - [Identity Creation](#identity-creation)
- - [Executions and Approvals](#executions-and-approvals)
- - [Management Activities](#management-activities)
- - [Constants / View functions](#constants--view-functions)
- - [Adding new functionality to identitities](#adding-new-functionality-to-identitities)
- - [Upgrade an `IdentityKernel` instance](#upgrade-an-identitykernel-instance)
- - [Setting up Identity Recovery contract](#setting-up-identity-recovery-contract)
- - [Recovering an Identity](#recovering-an-identity)
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
Identities can perform management activities on themselves, as well as performing actions in other contracts. These operations are performed with the `execute()` and `approve()` functions.

`execute(address _to, uint256 _value, bytes _data)` is called when you wish to perform an operation. This function may be called by a management key or by an action key and triggers an `ExecutionRequested` event. Management keys are required when `_to` refers to the identity itself, otherwise, action keys are required.

The `_value` parameters refer to the amount in ether that this transaction will send to the contract/wallet address specified in `_to`. The identity contract should have funds if the value is greater than `0`.

`_data` refers to the byte encoding of the operations and parameters to be executed.  `web3.eth.abi.encodeFunctionCall` is useful to generate the bytecode to be sent in this function. Here's an example on how to use it to call the `addKey` function of the identity contract: 

```
const web3EthAbi = require("web3-eth-abi");
let data = web3EthAbi.encodeFunctionCall({
    name: 'addKey',
    type: 'function',
    inputs: [{
        type: 'bytes32',
        name: '_key'
    },{
        type: 'uint256',
        name: '_purpose'
    },{
        type: 'uint256',
        name: '_type'
    }]
}, ["0x1234567", 1, 1]);

let receipt = await identityContractInstance.execute(identityContractInstance.address, 0, data).send({from: accounts[0]});
```
A javascript utils library is provided in `utils/identityUtils.js` which can be used to generate the payloads used in the `_data` parameter of the `execute` function

Once the `execute` function is executed, if the minimum required approvals by key purpose is one, the transaction is executed immediatly (Triggering the `Approved` and `Executed` events).

In case the minimum required approvals are greater than 1, `approve(uint256 _id, bool _approval)` needs to be called by N management or action keys depending on the operation to perform, each call triggering an `Approved` event. Once the minimum approvals required is reached, the transaction will be executed immediatly. This `approve` function requires an transaction execution id, which can be obtained by the `ExecutionRequested` event triggered by the `execute` function.

### Management Activities
Identity management is limited to the addition, removal and setting of the minimum required approvals to perform a transaction. These activities will fall into the approval process requiring that N managers approve their execution before it is performed.
- `addKey(bytes32 _key, uint256 _purpose, uint256 _type)`. Registers a key in the identity. Keys should have a defined purpose and type. The `_purpose` of a key can be `1` - Management keys, used only to perform management activities; `2` - Action keys, used only to perform calls to external contracts and sending ether; `3` - Claim signer key, which are keys that can add claims to the identity; and `4` - Encryption keys, at the moment used only for information purposes. The `_type` of keys supported at the moment are `0` for ethereum addresses, `1` for ECDSA. Keys are stored as a bytes32 value. Both `_purpose` and `_type` accepts `uint256` types, so they're not limited to the values described in here. It is worth mentioning that keys can have more than one purpose and `addKey` can be called for the same key more than once, assuming the purpose is different each time it is called. Triggers a `KeyAdded` event.
- `removeKey(bytes32 _key, uint256 _purpose)`. Used to remove an existing key-purpose pair. It will fail if you're removing a management key, and there is only one management key registered in the identity. Triggers a `KeyRemoved` event.
- `replaceKey(bytes32 _oldKey, bytes32 _newKey, uint256 _newType)`. Used to replace an existing key, for a new one that can have a different type. Triggers both a `KeyRemoved` and `KeyAdded` event.
- `setMinimumApprovalsByKeyType(uint256 _purpose, uint256 _minimumApprovals)`. By default, an `Identity` has only one management key registered (the owner of the identity), however it is possible to have more than one management key registered with `addKey`, and require a N of M approvals (both for Management and Action keys). This is done with this function, where you have to specify number of minimum approvals required by key purpose.

### Claims
Lorem Ipsum

### Constants / View functions
The following functions are provided to access information about an identity:
- `getKey(bytes32 _key, uint256 _purpose)`. Returns the key type, purpose and key for a given key-purpose pair
- `isKeyPurpose(bytes32 _key, uint256 _purpose)` returns if a given key-purpose exists, and if it's purpose is actually what was specified.
- `getKeyPurpose(bytes32 _key)` returns an array of purposes for a given key.
- `function getKeysByPurpose(uint256 _purpose)` returns an array of keys for a given purpose.
- `getClaim(bytes32 _claimId)` returns the claim information registered for a given claim Id.
- `getClaimIdsByType(uint256 _claimType)` returns an array of claim Ids for a given claim type.

### Adding new functionality to identitities
New versions of identities should extend from `IdentityKernel` and need to be registered in the `IdentityFactory`. This is done by creating a new instance of the new contract which inherits from `IdentityKernel`, and then calling the `setKernel` function of the `IdentityFactory` specifiying the address of the updated identity kernel, and a `bytes32` info hash with the description of the new version.
Once updated, a `NewKernel` event is triggered.

### Upgrade an `IdentityKernel` instance 
When an identity instance needs to be upgraded, we can use the execute/approve process to upgrade it to an specific version. This upgrade process requires using `execute` to call two functions
- `updateRequestUpdatableInstance(address _newKernel)`. This will generate a pending request for upgrading an instance `30 days` later and trigger an UpdateRequested event. 
- `updateConfirmUpdatableInstance(address _newKernel)`. After `30 days` pass, this function needs to be invoked to confirm the update process. Once the update process is completed a UpdateConfirmed event is triggered.
- An request for update can be cancelled if it hasn't been approved yet. This is done using the function `updateCancelUpdatableInstance()` with the same execute/approve process 

Kernel addresses could be obtained using the `getVersion` function of the `IdentityFactory`

### Setting up Identity Recovery contract
After creating an identity with the `IdentityFactory`, an instance of `FriendsRecovery` need to be created. The constructor of this contract expects the following parameters:
- `_identity`: The identity contract address
- `_setupDelay`: Time for users to be able to change the selected friends for recovery.
- `_threshold`: Minimum number of friends required to recover an identity
- `_secret`: sha3 of the identity address + a secret word
- `friendHashes`: an array of sha3 hashes compossed of the identity address + secret word + friend ethereum address.

Once this recovery contract is created, we need to associate it with the identity. This is done through the execute/approve mechanism of the identity, sending a payload to invoke the `setupRecovery` function of the identity, passing the recovery contract address as a parameter.


### Recovering an Identity
Recovery of an identity happens when you lose access to the management key(s). The recovery is done having the friends sign a message. This message is a sha3 hash compossed of:

```
identity address + secret word + the function and parameters of the function to invoke encoded + 
new secret word hash + new friend hashes. 
```

Where new `new secret word hash` is a sha3 of the identity address + secret word; and `new friend hashes` is an array of sha3 hashes compossed of the identity address + secret word + friend ethereum address).

Normally the function that is going to be encoded should be the identity `managerReset` with the address of the new management key.

A minimum of (threshold) friends should approve this recovery attempt, and this can be done by them spending gas, calling the `approve` function of the recovery contract; or by having a single address (probably the identity owner) calling `approvePreSigned`.

`approve` should be called sending  the sha3 hashed message described previously, and `approvePreSigned` needs gathering the signatures of the hashed message into different arrays (for v, r, and s)

Once the approvation is complete, the `execute` function of the recovery contract needs to be called, with the parameters used to generate the hashed message, and after the recovery is completed, `processManagerReset` needs to be executedn on the identity to remove all the management keys different from the new management key used for the recovery

An example of how to use the recovery contract is available in `test/friendsRecovery.js`.

