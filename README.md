# status.im Simple Multisig

v0.0.2 features:
- bootstrap ui
- Identify if account is owner
- submit transaction
- list transactions
- confirm/revoke transaction 
- list owners
- remove owner
- add owner
- routes (#wallet/0xYourMultiSigWallet)

## Release
[ipfs://QmTkeUd6ovXkhLGw4eL4Gje75shJ2Micwi5dDCgALqNTc9](ipfs://QmTkeUd6ovXkhLGw4eL4Gje75shJ2Micwi5dDCgALqNTc9) [@infura](https://ipfs.infura.io/ipfs/QmTkeUd6ovXkhLGw4eL4Gje75shJ2Micwi5dDCgALqNTc9/) [@ipfs.io](https://gateway.ipfs.io/ipfs/QmTkeUd6ovXkhLGw4eL4Gje75shJ2Micwi5dDCgALqNTc9/) [@cloudflare](https://cloudflare-ipfs.com/ipfs/QmTkeUd6ovXkhLGw4eL4Gje75shJ2Micwi5dDCgALqNTc9/)


## Build
Requires embark 4.0.1. Recommended use of https://github.com/creationix/nvm
Usage: 
 ```
 nvm install v10.15
 nvm use v10.15
 npm install -g embark
 git clone https://github.com/status-im/contracts.git
 cd contracts
 git checkout multisig
 npm install
 embark run 
 ```

