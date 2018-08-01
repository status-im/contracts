
# @rramos notes
I configured the project to run with Embark (Only demo.py was tested). To run this project in Ubuntu, the following steps need to be executed

1. `npm install`
2. Open at least 4 terminals (you can use `tmux` for this)
3. In Terminal-1, execute `embark simulator`
4. In Terminal-2, execute `embark run`
5. In Terminal-3: 
```
cd plasma_cash
virtualenv erc721plasma -p python3.6
source erc721plasma/bin/activate
pip install -r requirements.txt
FLASK_APP=./child_chain FLASK_ENV=development flask run --port=8546
```
6. In Terminal-4:
```
cd plasma_cash
source erc721plasma/bin/activate
python demo.py
```
 
 Most of the previous instructions are covered here, I just wrote them here for quick reference.

If installing the server from scratch:
 1. Install Nodejs with `nvm`
 2. Follow the instructions from Embark for its installation, 
 3. `sudo apt install virtualenv python3 python3-dev libssl-dev build-essential` 

 _NOTE_: `nvm` and Embark must be installed with a normal user. Don't use `root`!



# Development Dependencies

A patched version of web3.py is used because otherwise it does not work with Ganache due to issue #674. In addition, in order to be able to monitor events, PR #827, which is not merged yet. Pyethereum dependencies broke recently so we need to manually install a slightly older version of rlp encoding. Flask is used for server purposes.

On OSX + Homebrew
```
source /usr/local/bin/virtualenvwrapper.sh
```


```
mkvirtualenv erc721plasma --python=/usr/bin/python3.6
pip install -r requirements.txt
```

## Launch Plasma Chain

1. Make sure the contracts are deployed at the correct addresses (`npm run migrate:dev` in `server` directory)
2. Run `FLASK_APP=./child_chain FLASK_ENV=development flask run --port=8546` in one terminal. This will start a Plasma Chain instance which listens at `localhost:8546` and is also connected to the deployed contracts
3. Run `python demo.py`

TODO Should probably bundle these into makefiles, i.e. `make server` should launch the plasma chain.


## Testing

```
make test
```

## Linting

```
make lint
```
