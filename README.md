# status.im contracts

Requires Android Debugger
Download: 
https://dl.google.com/android/repository/platform-tools_r28.0.0-windows.zip
https://dl.google.com/android/repository/platform-tools_r28.0.0-linux.zip
https://dl.google.com/android/repository/platform-tools_r28.0.0-darwin.zip
Usage: 
 ```
 npm install -g embark
 git clone https://github.com/status-im/contracts.git
 cd contracts
 npm install
 embark blockchain
 embark run
    
 adb reverse tcp:8000 tcp:8000
 adb reverse tcp:8545 tcp:8545
 adb reverse tcp:8546 tcp:8546
 
 ```

| Contract                               | Deploy | Test | UI  |
| -------------------------------------- | ------ | ---- | --- |
| token/TestToken                        | Yes    | Yes  | Yes |
| token/ERC20Token                       | No     | Yes  | Yes |
| FailTest                               | Yes    | No   | Yes |