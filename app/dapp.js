import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import web3 from "Embark/web3"
import EmbarkJS from 'Embark/EmbarkJS';
import SNT from  'Embark/contracts/SNT';
import Web3Render from './components/standard/Web3Render';
import DrawField from './components/draw/DrawField';
import ContractClient, { createContract } from './contract_client'
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
        this.createContract();
        this._setAccounts();
      }
      web3.eth.net.getId((err, netId) => {
        //if (netId !== MAINNET) this.setState({ web3Provider: false})
      })
    })
  }

  async createContract() {
    const { tileStateUpdateHandler } = this;
    this.contractClient = await createContract(tileStateUpdateHandler);
    this.requestUpdateTilesOnCanvas();
  }

  tileStateUpdateHandler = tileData => {
    const { returnValues: { state } } = tileData;
    console.log('tile state update event received');
    this.setState({ canvasState: state });
  }

  async requestUpdateTilesOnCanvas() {
    const tileMapState = await this.contractClient.methods.GetTileMapState().call()
    if (tileMapState) {
      const canvasState = JSON.parse(tileMapState);
      this.setState({ canvasState });
    }
  }

  setTileMapState = async (data) => {
    await this.contractClient.methods.SetTileMapState(data).send()
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
    const { setTileMapState } = this;
    const { web3Provider, loading, canvasState } = this.state;
    return (
      <Web3Render ready={web3Provider}>
        <DrawField setTileMapState={setTileMapState} canvasState={canvasState} />
      </Web3Render>
    );
  }
}

ReactDOM.render(<App></App>, document.getElementById('app'));
