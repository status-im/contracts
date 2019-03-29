import React from 'react';
import ReactDOM from 'react-dom';
import EmbarkJS from 'Embark/EmbarkJS';
import MultiSigWallet from 'Embark/contracts/MultiSigWallet';
import MultiSigWalletUI from './components/multisigwallet';
import { Alert, FormGroup, ControlLabel, FormControl } from 'react-bootstrap';
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
      contractSetError: null,
      contractAddress: null
    };
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


  setContractAddress(e) {
    this.setState({contractSetError: null})
    try{
      const contractAddress = web3.utils.toChecksumAddress(e.target.value);
      web3.eth.getCode(contractAddress).then((code) => {
        if(code.length > 2){
          let mswInstance = new web3.eth.Contract(MultiSigWallet._jsonInterface, contractAddress)
          mswInstance.methods.required().call().then((req) => {
            if(req > 0){
              EmbarkJS.enableEthereum().then((s)=>{
                if(s){
                  let defaultAccount = web3.utils.toChecksumAddress(s[0]);
                  mswInstance.methods.isOwner(defaultAccount).call().then((isOwner) => {
                    this.setState({isOwner:isOwner, account: defaultAccount, contractAddress: contractAddress, mswInstance: mswInstance});  
                  })
                }
              })
                
            } else {
              this.setState({contractSetError: "Invalid MultiSigWallet"})
            }
          }).catch((e) => {
            this.setState({contractSetError: "Not a MultiSigWallet"})
          })   
        } else {
          this.setState({contractSetError: "Not a smart contract"})
        }
      })
    }catch(e){
      this.setState({contractSetError: e.toString()})
    }

  }
  render() {
    if (this.state.error) {
      return (<div>
        <div>Something went wrong connecting to ethereum. Please make sure you have a node running or are using metamask to connect to the ethereum network:</div>
        <div>{this.state.error}</div>
      </div>);
    }
    return (
    <div>
      <h2>MultiSig Wallet</h2>

      {!this.state.mswInstance && <form> 
       <FormGroup>
            <ControlLabel>Contract Address:</ControlLabel>
            <FormControl
                type="text"
                defaultValue={ this.state.contractAddress }
                placeholder="address"
                onChange={(e) => this.setContractAddress(e)}
            />
        </FormGroup> 
        { this.state.contractSetError != null && <Alert bsStyle="danger">{this.state.contractSetError}</Alert> }
      </form>}
      { this.state.mswInstance && <MultiSigWalletUI isOwner={this.state.isOwner} account={this.state.account} instance={this.state.mswInstance} /> }
    </div>);
  }
}

ReactDOM.render(<App></App>, document.getElementById('app'));
