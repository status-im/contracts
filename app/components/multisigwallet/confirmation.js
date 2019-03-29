import React from 'react';
import { Button } from 'react-bootstrap';

class MSWConfirmation extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            control: props.control,
            mswInstance: props.instance,
            transactionId: props.id,
            account: props.account,
            accountConfirmed: false,
            confirmations: 0,
            required: 0,
            error: null,
            mined: null
        };
        this.load()
    }   

    load() { 
        this.state.mswInstance.methods.required().call().then((required) => {
            this.setState({required: required});
        })
        this.state.mswInstance.methods.getConfirmationCount(this.state.transactionId).call().then((confirmations) => {
            this.setState({confirmations: confirmations});
        })
        if(this.state.control){
            this.state.mswInstance.methods.confirmations(this.state.transactionId, this.state.account).call().then((accountConfirmed) => {
                this.setState({accountConfirmed: accountConfirmed});
            })
        }
        
    }

    async handleClick(e){
        e.preventDefault();

        const {transactionId, value} = this.state;

        this.setState({output: null, error: null, receipt: null});

        try {

            const toSend = this.state.accountConfirmed ? this.state.mswInstance.methods.revokeConfirmation(transactionId) : this.state.mswInstance.methods.confirmTransaction(transactionId);
            const estimatedGas = await toSend.estimateGas({from: this.state.account});
            const receipt = await toSend.send({
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

    render(){
        const {accountConfirmed, confirmations, required} = this.state;
        const txt = " ["+confirmations+"/"+required+"]";
        return( 
            <form>
                <Button disabled={!this.state.control} type="submit" bsStyle="primary" onClick={(e) => this.handleClick(e)}>{ (accountConfirmed ? "Revoke" : "Confirm")+txt }</Button>
            </form>)
    }
}

export default MSWConfirmation;