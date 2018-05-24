import React from 'react';
import ReactDOM from 'react-dom';
import { Tabs, Tab } from 'react-bootstrap';

import EmbarkJS from 'Embark/EmbarkJS';
import TopNavbar from './components/topnavbar';
import TestTokenUI from './components/testtoken';
import ERC20TokenUI from './components/erc20token';
import ProposalManager from './components/proposal-manager/proposal-manager'
import VotingDapp from './components/voting-dapp/voting-dapp';

import SNT from  'Embark/contracts/SNT';
window['SNT'] = SNT;

import './dapp.css';

class App extends React.Component {

  constructor(props) {
    super(props);
  }

  componentDidMount(){
    __embarkContext.execWhenReady(() => {
    });
  }

  setAccount(_account){
    this.setState({account: _account});
  }

  _renderStatus(title, available) {
    let className = available ? 'pull-right status-online' : 'pull-right status-offline';
    return <React.Fragment>
      {title}
      <span className={className}></span>
    </React.Fragment>;
  }

  render(){
    return (
      <div>
        <TopNavbar accountUpdateHandler={(e) => this.setAccount(e)} />
        <Tabs defaultActiveKey={0} id="uncontrolled-tab-example">
          <Tab eventKey={0} title="VotingDapp">
              <VotingDapp />
          </Tab>
          <Tab eventKey={1} title="TestToken">
              <TestTokenUI />
          </Tab>
          <Tab eventKey={2} title="ERC20Token">
              <ERC20TokenUI />
          </Tab>
          <Tab eventKey={3} title="ProposalManager">
            <ProposalManager />
          </Tab>
        </Tabs>
      </div>);
  }
}

ReactDOM.render(<App></App>, document.getElementById('app'));
