import React from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import EmbarkJS from 'Embark/EmbarkJS';
import TestTokenUI from './components/TestStatusNetwork';

import './dapp.css';

class DApp extends React.Component {

  constructor(props) {
    super(props);

    
  }

  componentDidMount(){ 

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

        <Tabs defaultActiveKey={1} id="uncontrolled-tab-example">
          <Tab eventKey={1} title="TestToken">
              <TestTokenUI />
          </Tab>
        </Tabs>
      </div>);
  }
}

export default DApp;
