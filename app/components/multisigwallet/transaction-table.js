import React from 'react';
import { Table } from 'react-bootstrap';
import MSWConfirmation from './confirmation';
import MSWSubmitTransaction from './transaction-submit';


class MSWTransactionTable extends React.Component {

    constructor(props) {
      super(props);
      this.state = {
        control: props.control,
        account: props.account,
        mswInstance: props.instance,
        transactionCount: 0,
        executedTxs: [],
        pendingTxs: []
      }   
      this.loadAll()   
    }  
    
    loadAll() {
        this.state.mswInstance.methods.transactionCount().call().then((count) => {
            this.transactionCount = count;
            if(count > 0){
                for(var i=0; i < count; i++){
                    this.loadTx(i);
                }
            }

        })
        
    }

    loadTx(txId) {
        this.state.mswInstance.methods.transactions(txId).call().then((val) => {
            val.id = txId;
            if(val.executed){
                this.state.executedTxs.push(val);
            } else {
                this.state.pendingTxs.push(val);
            }
            this.forceUpdate();
        })
    }
    
    render() {
        const pendingTxs = this.state.pendingTxs.map((tx, index) => (
            <tr key={index}>
                <td>{tx.id}</td>
                <td><MSWConfirmation instance={this.state.mswInstance} control={this.state.control} account={this.state.account} id={tx.id} /></td>
                <td>To: {tx.destination} <br/> 
                Value: {tx.value}  <br/> 
                Data: {tx.data}</td>
            </tr>)
        )
        const executedTxs = this.state.executedTxs.map((tx, index) => (
            <tr key={index}>
                <td>{tx.id}</td>
                <td>To: {tx.destination} <br/> 
                Value: {tx.value}  <br/> 
                Data: {tx.data}</td>
            </tr>)
        )
        return (
            <React.Fragment>
                {this.state.control && <p>Warning: You are legally responsable by what you approve.</p>}
                {this.state.control && <p>Only approve when you are sure the execution is desired.</p>}
                {this.state.control && <MSWSubmitTransaction instance={this.state.mswInstance} account={this.state.account} /> }
                    <div>
                    <Table size="sm" responsive={true} striped bordered hover >
                        <thead>
                            <tr>
                                <th>TxId</th>
                                <th>Confirmations</th>
                                <th>Tx Info</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingTxs}
                        </tbody>
                    </Table>
                    <Table size="sm" responsive={true} striped bordered hover >
                        <thead>
                            <tr>
                                <th>TxId</th>
                                <th>Tx Info</th>
                            </tr>
                        </thead>
                        <tbody>
                            {executedTxs}
                        </tbody>
                    </Table>
                </div>
            </React.Fragment>
        )

    }
}

export default MSWTransactionTable;