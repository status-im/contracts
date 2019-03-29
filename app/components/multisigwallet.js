import EmbarkJS from 'Embark/EmbarkJS';
import MultiSigWallet from 'Embark/contracts/MultiSigWallet';
import React from 'react';
import {Tabs, Tab} from 'react-bootstrap';
import MSWTransactionTable from './multisigwallet/transaction-table';
import MSWOwnerTable from './multisigwallet/owner-table';
 
class MultiSigWalletUI extends React.Component {

    constructor(props) {
      super(props);
      this.state = {
        account: props.account,
        mswInstance: props.instance,
        isOwner: props.isOwner,
        activeKey: 1
      }   
 
    }  
    
    _addToLog(txt){
      console.log(txt);
    }
  
    handleSelect(key) {
      this.setState({ activeKey: key });
    }
  render() {
    return (
      <React.Fragment>
        <h2>{this.state.mswInstance._address}</h2>
        <Tabs id="multisig-controls">
          <Tab eventKey={1} title="Transactions">
            <MSWTransactionTable instance={this.state.mswInstance} account={this.state.account} control={this.state.isOwner}  />
          </Tab>
          <Tab eventKey={2} title="Owners">
            <MSWOwnerTable instance={this.state.mswInstance} account={this.state.account} control={this.state.isOwner} />
          </Tab>
        </Tabs>
      </React.Fragment>
    );
  }
}


export default MultiSigWalletUI;
