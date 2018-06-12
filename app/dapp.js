import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import { Tabs, Tab } from 'react-bootstrap';
import Toggle from 'react-toggle';
import EmbarkJS from 'Embark/EmbarkJS';
import TopNavbar from './components/topnavbar';
import TestTokenUI from './components/testtoken';
import ERC20TokenUI from './components/erc20token';
import ENSSubManagement from './components/ensSubManagement';
import NameLookup from './components/ens/nameLookup';
import AdminMode from './components/AdminMode'

import './dapp.css';

class App extends React.Component {
  constructor(props) {
    super(props)
  }
  state = { admin: false };

  componentDidMount(){
    __embarkContext.execWhenReady(() => {

    });
  }


  _renderStatus(title, available) {
    let className = available ? 'pull-right status-online' : 'pull-right status-offline';
    return <React.Fragment>
      {title}
      <span className={className}></span>
    </React.Fragment>;
  }

  render() {
    const { admin } = this.state;
    return (
      <div>
        <div style={{ display: admin ? 'block' : 'none' }} >
          <AdminMode style={{ display: admin ? 'block' : 'none' }}/>
        </div>
        {!admin &&
         <Fragment>
           <NameLookup />
           <div style={{ textAlign: 'center', marginTop: '10%' }}>
             <Toggle onChange={() => { this.setState({ admin: !admin })}} />
             <br/>
             <span>Admin Mode</span>
           </div>
         </Fragment>}
      </div>
    );
  }
}

export default App;
