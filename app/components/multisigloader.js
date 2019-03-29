import React from 'react';
import EmbarkJS from 'Embark/EmbarkJS';
import MultiSigWallet from 'Embark/contracts/MultiSigWallet';
import { Alert, FormGroup, ControlLabel, FormControl } from 'react-bootstrap';

class MultiSigLoader extends React.Component {

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.state = {
      error: null,
      activeKey: 1,
      blockchainEnabled: false,
      mswInstance: null,
      account: null,
      isOwner: false,
      contractSetError: null,
      contractAddress: props.address
    };
    if (props.address) {
      this.checkContractAddress(props.address)
    }

  }

  componentDidMount() {
  }

  handleChange(instance, account = null, isOwner = false) {
    this.props.onReady(instance, account, isOwner);
  }
  async setContractAddress(e) {
    this.checkContractAddress(e.target.value)
  }
  async checkContractAddress(contractAddress) {
    this.state.contractSetError=null;
    try {
      contractAddress = web3.utils.toChecksumAddress(contractAddress);
      let code = await web3.eth.getCode(contractAddress);
      if (code.length > 2) {
        let mswInstance = new web3.eth.Contract(MultiSigWallet._jsonInterface, contractAddress)
        try {
          let req = await mswInstance.methods.required().call(); //catch not multisig eallrt
          if (req > 0) {
            var account = null;
            var isOwner = false;
            try {
              let s = await EmbarkJS.enableEthereum();
              if (s) {
                account = web3.utils.toChecksumAddress(s[0]);
                isOwner = await mswInstance.methods.isOwner(account).call()
              }
            } catch (err) {
              this.setState({ contractSetError: err.toString() })
            }

            this.setState({ isOwner: isOwner, account: account, contractAddress: contractAddress, mswInstance: mswInstance });
            this.handleChange(mswInstance, account, isOwner);
          } else {
            this.setState({ contractSetError: "Invalid MultiSigWallet" })
          }
        } catch (e) {
          this.setState({ contractSetError: "Not a Multisig Wallet" })
        }
      } else {
        this.setState({ contractSetError: "Not a smart contract" })
      }
    } catch (e) {
      this.setState({ contractSetError: e.toString() })
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
        <h2>Existent Wallet</h2>
        <form>
          <FormGroup>
            <ControlLabel>Contract Address:</ControlLabel>
            <FormControl
              type="text"
              defaultValue={this.state.contractAddress}
              placeholder="address"
              onChange={(e) => this.setContractAddress(e)}
            />
          </FormGroup>
          {this.state.contractSetError != null && <Alert bsStyle="danger">{this.state.contractSetError}</Alert>}
        </form>
      </div>);
  }
}

export default MultiSigLoader;
