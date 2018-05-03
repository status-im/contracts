import React from 'react';
import ReactDOM from 'react-dom';
import { Tabs, Tab } from 'react-bootstrap';

import EmbarkJS from 'Embark/EmbarkJS';
import RND from 'Embark/contracts/RND';
import IdentityGasRelay from 'Embark/contracts/IdentityGasRelay';

import CallGasRelayed from './components/callgasrelayed';
import ApproveAndCallGasRelayed from './components/approveandcallgasrelayed';

import './relayer-test.css';

class App extends React.Component {

  constructor(props) {
    super(props);

    window['RND'] = RND;
    window['IdentityGasRelay'] = IdentityGasRelay;
  }

  _renderStatus(title, available){
    let className = available ? 'pull-right status-online' : 'pull-right status-offline';
    return <React.Fragment>
      {title} 
      <span className={className}></span>
    </React.Fragment>;
  }

  render(){
    return (<div><h3>IdentityGasRelay - Usage Example</h3>
      <Tabs defaultActiveKey={1} id="uncontrolled-tab-example">
        <Tab eventKey={1} title="callGasRelayed">
          <CallGasRelayed IdentityGasRelay={IdentityGasRelay} RND={RND} web3={web3} />
        </Tab>
        <Tab eventKey={2} title="approveAndCallGasRelayed">
          <ApproveAndCallGasRelayed IdentityGasRelay={IdentityGasRelay} RND={RND} web3={web3} />
        </Tab>
      </Tabs>
    </div>);
  }
}

ReactDOM.render(<App></App>, document.getElementById('app'));
