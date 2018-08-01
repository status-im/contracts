# @rramos notes

This project in particular requires yarn, and also a specific version of loom for plasma.
Again, I only made it able to run the first demo (demo.ts).

The process is as follows:

0. nodejs must have been installed with `nvm`
1. Install yarn
```
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt-get update && sudo apt-get install --no-install-recommends yarn
```
2. Install plasma-loom
```
wget https://private.delegatecall.com/loom/linux/build-246/loom
chmod +x loom
```

3. Create a loom.yml in the same directory that contains the line: `PlasmaCashEnabled: true`. This file may need additional information if youre going to use multiple nodes

4. Execute `./loom init`. In this step you may configure the genesis.json files for multiple nodes.

5. In separate terminal, or as a background process, go to the `contracts` repo root folder, and execute `embark simulator`, and `embark run` to deploy the contracts

6. Execute `./loom run` to start the loom process. This might require more options if using multiple nodes. Can be launched as a background process too.

7. Build and launch the demo.
```
yarn install
yarn build
yarn copy-contracts
yarn tape
```

This will execute the demo. If you want to execute it more than once, You need to start the simulator from scratch, because this demo assumes a specific chain state in ganache.



# [Loom.js](https://loomx.io) Plasma Cash E2E Tests

NodeJS & browser tests for Loom Plama Cash implementation.

## Development

The e2e test environment can be configured by changing `.env.test` (see `.env.test.example` for
default values).

```shell
# build for NodeJS
yarn build
# build for Browser (TBD!)
yarn build:browser
# run e2e tests using NodeJS
yarn test
# auto-format source files
yarn format
```
