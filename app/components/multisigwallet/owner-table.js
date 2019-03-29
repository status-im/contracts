import React from 'react';
import { Table, Button } from 'react-bootstrap';
import MSWAddOwner from './owner-add';

class MSWOwnerTable extends React.Component {

    constructor(props) {
      super(props);
      this.state = {
        control: props.control,
        account: props.account,
        mswInstance: props.instance,
        owners: []
      }   
      this.load()   
    }  
    
    load() {
        this.state.mswInstance.methods.getOwners().call().then((owners) => {
            this.setState({owners:owners});
        })
    }

    async removeOwner(e, account){
        e.preventDefault();


        this.setState({output: null, error: null, receipt: null});

        try {

            const toSend = this.state.mswInstance.methods.removeOwner(account);
            const MsSend = this.state.mswInstance.submitTransaction(
                this.state.mswInstance.address, 0, toSend.encodeABI
            )
            const estimatedGas = await MsSend.estimateGas({from: this.state.account});

            const receipt = await MsSend.send({
                from: this.state.account,
                gasLimit: estimatedGas
            });

            console.log(receipt);

            this.setState({receipt});


        } catch(err) {
            console.error(err);
            this.setState({error: err.message});
        }
    }
    
    render() {

        const owners = this.state.owners.map((address, index) => (
            <tr key={index}>
                <td>{address}</td>
                <td><Button disabled={!this.state.control} type="submit" bsStyle="primary" onClick={(e) => this.removeOwner(e, address)}>Remove</Button></td>
            </tr>)
        )

        return (
            <React.Fragment>
                {this.state.control && <MSWAddOwner instance={this.state.mswInstance} account={this.state.account} />}
                    <div>
                    <Table size="sm" responsive={true} striped bordered hover >
                        <thead>
                            <tr>
                                <th>Owner</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {owners}
                        </tbody>
                    </Table>
                    
                </div>
            </React.Fragment>
        )

    }
}

export default MSWOwnerTable;