import React from 'react';
import ReactDOM from 'react-dom';
import EmbarkJS from 'Embark/EmbarkJS';
import MultiSigWallet from 'Embark/contracts/MultiSigWallet';
import MultiSigWalletUI from './components/multisigwallet';
import MultiSigLoader from './components/multisigloader';
import { Alert, FormGroup, ControlLabel, FormControl } from 'react-bootstrap';
import { HashRouter, Route, Redirect } from "react-router-dom";
import './dapp.css';



class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      error: null,
      activeKey: 1,
      blockchainEnabled: false  ,
      mswInstance: null,
      account: null,
      isOwner: false,
    };
    this.onMultiSigReady = this.onMultiSigReady.bind(this);
  }

  componentDidMount() {
    EmbarkJS.onReady((err) => {
      this.setState({blockchainEnabled: true});
      if (err) {
        // If err is not null then it means something went wrong connecting to ethereum
        // you can use this to ask the user to enable metamask for e.g
        return this.setState({error: err.message || err});
      }
    });
  }

  onMultiSigReady(instance, account, isOwner) {
    this.setState({isOwner:isOwner, account: account, mswInstance: instance});  
  }

  render() {
    if (this.state.error) {
      return (<div>
        <div>Something went wrong connecting to ethereum. Please make sure you have a node running or are using metamask to connect to the ethereum network:</div>
        <div>{this.state.error}</div>
      </div>);
    }
    if(!this.state.mswInstance){
      return (
        <HashRouter hashType="noslash">
          <Route exact path="/" render={()=>(
            <MultiSigLoader onReady={this.onMultiSigReady}/>
          )} />
          <Route path="/wallet/:address" render={({match}) => (
           <MultiSigLoader address={match.params.address} onReady={this.onMultiSigReady}/>
          )} />
      </HashRouter>
      );
    } else {
      return(
        <HashRouter hashType="noslash">
          <Route exact path="/" render={()=>(
            <Redirect to={"/wallet/"+this.state.mswInstance._address }/>  
          )} />
          <Route path="/wallet/:address" render={(props)=>(
            props.match.params.address != this.state.mswInstance._address && <Redirect to={"/wallet/"+this.state.mswInstance._address }/> 
          )} />
          <MultiSigWalletUI instance={this.state.mswInstance} account={this.state.account} isOwner={this.state.isOwner}  /> 
        </HashRouter>
      );
      
    }
    
  }
}

ReactDOM.render(<App></App>, document.getElementById('app'));
