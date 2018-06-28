import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import web3 from "Embark/web3"
import EmbarkJS from 'Embark/EmbarkJS';
import PollManager from 'Embark/contracts/PollManager';
import AdminView from './components/AdminView';
import Voting from './components/Voting';
import SNT from  'Embark/contracts/SNT';
import { VotingContext } from './context';
window['SNT'] = SNT;

import './dapp.css';

const getPolls = (number, pollMethod) => {
  const polls = [];
  for (let i = number-1; i >= 0; i--) {
    const poll = pollMethod(i).call();
    polls.push(poll);
  }
  return Promise.all(polls.reverse());
}

class App extends React.Component {

  constructor(props) {
    super(props);
  }
  state = { admin: false };

  componentDidMount(){
    __embarkContext.execWhenReady(() => {
      this._getPolls();
      this._setAccounts();
    });
  }

  setAccount(_account){
    this.setState({account: _account});
  }

  _getPolls = async () => {
    const { nPolls, poll } = PollManager.methods;
    const polls = await nPolls.call();
    const total = await polls.call();
    if (total) getPolls(total, poll).then(rawPolls => { this.setState({ rawPolls })});
    else this.setState({ rawPolls: [] });
  }

  _setAccounts() {
    const { fromWei } = web3.utils;
    web3.eth.getAccounts(async (err, [address]) => {
      const balance = await SNT.methods.balanceOf(address).call();
      this.setState({ snt: { balance: fromWei(balance) }});
    })
  }

  updatePoll = async (idPoll) => {
    const { poll } = PollManager.methods;
    const { rawPolls } = this.state;
    const newPolls = [...rawPolls];
    const updatedPoll = await poll(idPoll).call();
    newPolls[idPoll] = updatedPoll;
    this.setState({ rawPolls: newPolls });
  }

  _renderStatus(title, available) {
    let className = available ? 'pull-right status-online' : 'pull-right status-offline';
    return <Fragment>
      {title}
      <span className={className}></span>
    </Fragment>;
  }

  render(){
    const { admin, rawPolls, snt } = this.state;
    const { _getPolls, updatePoll } = this;
    const toggleAdmin = () => this.setState({ admin: true });
    const votingContext = { getPolls: _getPolls, rawPolls, toggleAdmin, updatePoll, snt };
    return (
      <VotingContext.Provider value={votingContext}>
        <Fragment>
          {admin ?
           <AdminView setAccount={this.setAccount} /> :
           <Voting />}
        </Fragment>
      </VotingContext.Provider>
    );
  }
}

ReactDOM.render(<App></App>, document.getElementById('app'));
