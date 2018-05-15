# status.im contracts

Usage: 
 ```
 npm install -g embark
 git clone https://github.com/status-im/contracts.git
 cd contracts
 npm install
 embark simulator
 embark test
 embark run
 ```

| Contract                               | Deploy | Test | UI  |
| -------------------------------------- | ------ | ---- | --- |
| token/TestToken                        | Yes    | Yes  | Yes |
| token/ERC20Token                       | No     | Yes  | Yes |
| ens/ENSRegistry                        | Yes    | Yes  | No  |
| ens/PublicRegistry                     | Yes    | Yes  | No  |
| registry/ENSSubdomainRegistry          | Yes    | Yes  | No  |