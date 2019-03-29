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
- routes (/#wallet/0xYourMultiSigWallet)

## Release
[ipfs://QmcCiUCELq2PuUunfVGKin1wLaukX1ZNVN7si9rvr8SXA4](ipfs://QmcCiUCELq2PuUunfVGKin1wLaukX1ZNVN7si9rvr8SXA4) [@infura](https://ipfs.infura.io/ipfs/QmcCiUCELq2PuUunfVGKin1wLaukX1ZNVN7si9rvr8SXA4/) [@ipfs.io](https://gateway.ipfs.io/ipfs/QmcCiUCELq2PuUunfVGKin1wLaukX1ZNVN7si9rvr8SXA4/) [@cloudflare](https://cloudflare-ipfs.com/ipfs/QmcCiUCELq2PuUunfVGKin1wLaukX1ZNVN7si9rvr8SXA4/)


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

