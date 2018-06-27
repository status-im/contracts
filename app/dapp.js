import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import EmbarkJS from 'Embark/EmbarkJS';
import PollManager from 'Embark/contracts/PollManager';
import AdminView from './components/AdminView';
import Voting from './components/Voting';
import SNT from  'Embark/contracts/SNT';
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
      this._setVotingOptions();
    });
  }

  setAccount(_account){
    this.setState({account: _account});
  }

  async _getPolls(){
    const { nPolls, poll } = PollManager.methods;
    const polls = await nPolls.call();
    const total = await polls.call();
    getPolls(total, poll).then(rawPolls => { this.setState({ rawPolls })});
  }

  _renderStatus(title, available) {
    let className = available ? 'pull-right status-online' : 'pull-right status-offline';
    return <Fragment>
      {title}
      <span className={className}></span>
    </Fragment>;
  }

  render(){
    const { admin, rawPolls } = this.state;
    const toggleAdmin = () => this.setState({ admin: true });
    return (
      <Fragment>
        {admin ?
         <AdminView setAccount={this.setAccount} /> :
         <Voting toggleAdmin={toggleAdmin} rawPolls={rawPolls} />}
      </Fragment>
    );
  }
}

ReactDOM.render(<App></App>, document.getElementById('app'));
