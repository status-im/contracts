# status.im contracts
Requires https://github.com/creationix/nvm
Usage: 
 ```
 nvm install v8.9.4
 nvm use v8.9.4
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
| deploy/Instance                        | No     | No   | No  |
| deploy/Factory                         | No     | No   | No  |