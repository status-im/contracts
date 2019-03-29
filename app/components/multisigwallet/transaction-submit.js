import React from 'react';
import { FormGroup, ControlLabel, FormControl, Button, Alert } from 'react-bootstrap';
class MSWSubmitTransaction extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            account: props.account,
            mswInstance: props.instance,
            input: {
                destination: '',
                value: '',
                data: ''
            },
            error: null,
            mined: null
        };
    }

    handleChangeFile(e) {
        const {input} = this.state;
        input.file = [e.target];
        this.setState({input});
    }

    handleChange(e, name) {
        const {input} = this.state;
        input[name] = e.target.value;
        this.setState({input});
    }

    handleCheckbox(e, name) {
        const {input} = this.state;
        input[name] = e.target.checked;
        this.setState({input});
    }

    async handleClick(e){
        e.preventDefault();

        const {input, value} = this.state;

        this.setState({output: null, error: null, receipt: null});

        try {

            const toSend = this.state.mswInstance.methods.submitTransaction(input.destination, input.value, input.data);

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
        const {input, value, error, output, receipt} = this.state;

        return <div className="formSection">
            <h3>submitTransaction</h3>
            <form>
                <FormGroup>
                    <ControlLabel>destination</ControlLabel>
                    <FormControl
                        type="text"
                        defaultValue={ input.destination }
                        placeholder="address"
                        onChange={(e) => this.handleChange(e, 'destination')}
                    />
                </FormGroup>
                <FormGroup>
                    <ControlLabel>value</ControlLabel>
                    <FormControl
                        type="text"
                        defaultValue={ input.value }
                        placeholder="uint256"
                        onChange={(e) => this.handleChange(e, 'value')}
                    />
                </FormGroup>
                <FormGroup>
                    <ControlLabel>data</ControlLabel>
                    <FormControl
                        type="text"
                        defaultValue={ input.data }
                        placeholder="bytes"
                        onChange={(e) => this.handleChange(e, 'data')}
                    />
                </FormGroup>

                { error != null && <Alert bsStyle="danger">{error}</Alert> }

                <Button type="submit" bsStyle="primary" onClick={(e) => this.handleClick(e)}>Send</Button>
                {
                receipt &&
                <Fragment>
                    <Alert bsStyle={isSuccess(receipt.status) ? 'success' : 'danger'}>{isSuccess(receipt.status) ? 'Success' : 'Failure / Revert'} - Transaction Hash: {receipt.transactionHash}</Alert>
                </Fragment>

                }
            </form>
        </div>;
    }
}

export default MSWSubmitTransaction;