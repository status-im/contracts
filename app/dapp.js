import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import { Tabs, Tab } from 'react-bootstrap';
import Toggle from 'react-toggle';
import EmbarkJS from 'Embark/EmbarkJS';
import TopNavbar from './components/topnavbar';
import TestTokenUI from './components/testtoken';
import ERC20TokenUI from './components/erc20token';
import TestToken from 'Embark/contracts/TestToken';
import ENSSubManagement from './components/ensSubManagement';
import ENSSubdomainRegistry from 'Embark/contracts/ENSSubdomainRegistry';
import NameLookup from './components/ens/nameLookup';
import AdminMode from './components/AdminMode';
import TokenPermissions from './components/standard/TokenPermissionConnect';
import web3 from "Embark/web3";
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

import './dapp.css';

const { getNetworkType } = web3.eth.net;

const symbols = {
  'ropsten': 'STT',
  'private': 'SNT',
  'main': 'SNT'
}

class App extends React.Component {
  constructor(props) {
    super(props)
  }
  state = { admin: false };

  componentDidMount(){
    __embarkContext.execWhenReady(() => {
      getNetworkType().then(network => { this.setState({ network })});

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
    const { admin, network } = this.state;
    return (
      <div>
        <div style={{ display: admin ? 'block' : 'none' }} >
          <AdminMode style={{ display: admin ? 'block' : 'none' }}/>
        </div>
        {!admin &&
         <Fragment>
           <Paper elevation={4}>
             <Typography style={{ fontSize: '2.5rem', padding: '0.5%', textAlign: 'center' }} variant="headline" component="h3"><i style={{ fontSize: '1rem' }}>network </i>{network}</Typography>
           </Paper>
           <NameLookup />
           <div style={{ textAlign: 'center' }}>
             <TokenPermissions
               symbol={symbols[network] || 'SNT'}
               spender={ENSSubdomainRegistry._address}
               methods={TestToken.methods} />
             <hr/>
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
