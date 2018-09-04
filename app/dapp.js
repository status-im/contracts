import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import 'typeface-roboto'
import CssBaseline from '@material-ui/core/CssBaseline';
import { Tabs, Tab } from 'react-bootstrap';
import Toggle from 'react-toggle';
import EmbarkJS from 'Embark/EmbarkJS';
import TopNavbar from './components/topnavbar';
import TestTokenUI from './components/testtoken';
import ERC20TokenUI from './components/erc20token';
import TestToken from 'Embark/contracts/TestToken';
import ENSSubManagement from './components/ensSubManagement';
import UsernameRegistrar from 'Embark/contracts/UsernameRegistrar';
import NameLookup from './components/ens/nameLookup';
import AdminMode from './components/AdminMode';
import TokenPermissions from './components/standard/TokenPermissionConnect';
import web3 from "Embark/web3";
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Welcome from './components/ens/welcome';
import Fade from '@material-ui/core/Fade';
import Hidden from '@material-ui/core/Hidden';
import Web3Render from './components/standard/Web3Render';
import StatusOptimized from './components/standard/StatusOptimized';

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
  state = { admin: false, searching: false };

  componentDidMount(){
    __embarkContext.execWhenReady(() => {
      getNetworkType().then(network => { this.setState({ network })});

    });
  }

  render() {
    const { admin, network, searching } = this.state;
    const toggleSearch = () => { this.setState({ searching: !searching }) };
    const isRopsten = network === 'ropsten';
    const isMainnet = network === 'main';
    return (
      <div>
        <CssBaseline />
        <Hidden mdDown>
          <StatusOptimized />
        </Hidden>
        <div style={{ display: admin ? 'block' : 'none' }} >
          <AdminMode style={{ display: admin ? 'block' : 'none' }}/>
        </div>
        {!searching && <Fade in={!searching}>
          <div>
            <Welcome toggleSearch={toggleSearch} />
          </div>
        </Fade>}
        {searching && <Fade in={searching}>
          <Web3Render ready={network == 'private'} network={network}>
            <div>
              <NameLookup />
              <Hidden mdDown>
                <div style={{ textAlign: 'center', margin: '0px 40px' }}>
                  <TokenPermissions
                    symbol={symbols[network] || 'SNT'}
                    spender={UsernameRegistrar._address}
                    methods={TestToken.methods} />
                  <hr/>
                  <Toggle onChange={() => { this.setState({ admin: !admin })}} />
                  <br/>
                  <span>Admin Mode</span>
                </div>
              </Hidden>
            </div>
          </Web3Render>
        </Fade>}
      </div>
    );
  }
}

export default App;
