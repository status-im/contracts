import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import web3 from "Embark/web3"
import EmbarkJS from 'Embark/EmbarkJS';
import PollManager from 'Embark/contracts/PollManager';
import AdminView from './components/AdminView';
import Voting from './components/Voting';
import SNT from  'Embark/contracts/SNT';
import { VotingContext } from './context';
import Web3Render from './components/standard/Web3Render';
import fetchIdeas from './utils/fetchIdeas';
import { getPolls, omitPolls } from './utils/polls';
import DrawField from './components/draw/DrawField';
import ContractClient from './contract_client'
window['SNT'] = SNT;

import './dapp.css';

const MAINNET = 1;

class App extends React.Component {

  constructor(props) {
    super(props);
  }
  state = { admin: false, pollOrder: 'NEWEST_ADDED', web3Provider: true, loading: true };

  componentDidMount(){
    EmbarkJS.onReady((err) => {
      if (err) this.setState({ web3Provider: false });
      else {
        //this.contractClient = new ContractClient()
        this._setAccounts();
      }
      web3.eth.net.getId((err, netId) => {
        //if (netId !== MAINNET) this.setState({ web3Provider: false})
      })
    })
  }

  setAccount(_account){
    this.setState({account: _account});
  }

  _setAccounts() {
    const { fromWei } = web3.utils;
    web3.eth.getAccounts(async (err, [address]) => {
      const balance = await SNT.methods.balanceOf(address).call();
      this.setState({ snt: { balance: fromWei(balance) }});
    })
  }

  render(){
    const { web3Provider, loading } = this.state;
    return (
      <Web3Render ready={web3Provider}>
        <DrawField />
      </Web3Render>
    );
  }
}

ReactDOM.render(<App></App>, document.getElementById('app'));
