# Contracts


## Installation
1. Install Embark with `npm install -g embark` 
2. Browse the folder where the contract repository has been cloned and execute `npm install`
3. Execute `embark blockchain` to run a private node, or `embark simulator` for testrpc
4. Execute `embark run` to compile contracts and run webserver (if applies).

If you need to access the abi for the contracts, after running the previous commands, they will be available in the folder `./dist/contracts/`

See more information about Embark framework here: https://embark.status.im/

## Projects

### Tribute to talk
- Idea #96 Tribute to Talk - [Link](https://ideas.status.im/ideas/96-message-tributes)
- Documentation: [TributeToTalk.md](TributeToTalk.md)
- Running test - After executing `embark run` to compile the contracts, `node test/messageSigned-test.js`  This will be changed in the future to run with `embark test` 
