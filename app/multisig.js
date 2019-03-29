import EmbarkJS from 'Embark/EmbarkJS';
import MultiSigWalletWithDailyLimit from 'Embark/contracts/MultiSigWalletWithDailyLimit';

import React, { Component, Fragment } from 'react';
import ReactDOM from 'react-dom';
import { FormGroup, ControlLabel, FormControl, Checkbox, Button, Alert, InputGroup } from 'react-bootstrap';

function isSuccess(status) {
    return status === "0x1" || status === true;
}

class OwnersForm0 extends Component {
    constructor(props){
        super(props);
        this.state = {
            input: {
                field: ''
            },
            output: null,
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
            const result = await MultiSigWalletWithDailyLimit.methods.owners(input.field).call();
            this.setState({output: result});


        } catch(err) {
            console.error(err);
            this.setState({error: err.message});
        }
    }

    render(){
        const {input, value, error, output, receipt} = this.state;

        return <div className="formSection">
            <h3>owners</h3>
            <form>
                <FormGroup>
                    <ControlLabel>field</ControlLabel>
                    <FormControl
                        type="text"
                        defaultValue={ input.field }
                        placeholder="uint256"
                        onChange={(e) => this.handleChange(e, 'field')}
                    />
                </FormGroup>

                { error != null && <Alert bsStyle="danger">{error}</Alert> }

                <Button type="submit" bsStyle="primary" onClick={(e) => this.handleClick(e)}>Call</Button>
                {
                    output &&
                    <Fragment>
                        <h4>Results</h4>
                        {output.toString()}
                    </Fragment>
                }
            </form>
        </div>;
    }
}

class RemoveOwnerForm1 extends Component {
    constructor(props){
        super(props);
        this.state = {
            input: {
                owner: ''
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

            const toSend = MultiSigWalletWithDailyLimit.methods.removeOwner(input.owner);

            const estimatedGas = await toSend.estimateGas({from: web3.eth.defaultAccount});

            const receipt = await toSend.send({
                from: web3.eth.defaultAccount,
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
            <h3>removeOwner</h3>
            <form>
                <FormGroup>
                    <ControlLabel>owner</ControlLabel>
                    <FormControl
                        type="text"
                        defaultValue={ input.owner }
                        placeholder="address"
                        onChange={(e) => this.handleChange(e, 'owner')}
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

class RevokeConfirmationForm2 extends Component {
    constructor(props){
        super(props);
        this.state = {
            input: {
                transactionId: ''
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

            const toSend = MultiSigWalletWithDailyLimit.methods.revokeConfirmation(input.transactionId);

            const estimatedGas = await toSend.estimateGas({from: web3.eth.defaultAccount});

            const receipt = await toSend.send({
                from: web3.eth.defaultAccount,
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
            <h3>revokeConfirmation</h3>
            <form>
                <FormGroup>
                    <ControlLabel>transactionId</ControlLabel>
                    <FormControl
                        type="text"
                        defaultValue={ input.transactionId }
                        placeholder="uint256"
                        onChange={(e) => this.handleChange(e, 'transactionId')}
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

class IsOwnerForm3 extends Component {
    constructor(props){
        super(props);
        this.state = {
            input: {
                field: ''
            },
            output: null,
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
            const result = await MultiSigWalletWithDailyLimit.methods.isOwner(input.field).call();
            this.setState({output: result});


        } catch(err) {
            console.error(err);
            this.setState({error: err.message});
        }
    }

    render(){
        const {input, value, error, output, receipt} = this.state;

        return <div className="formSection">
            <h3>isOwner</h3>
            <form>
                <FormGroup>
                    <ControlLabel>field</ControlLabel>
                    <FormControl
                        type="text"
                        defaultValue={ input.field }
                        placeholder="address"
                        onChange={(e) => this.handleChange(e, 'field')}
                    />
                </FormGroup>

                { error != null && <Alert bsStyle="danger">{error}</Alert> }

                <Button type="submit" bsStyle="primary" onClick={(e) => this.handleClick(e)}>Call</Button>
                {
                    output &&
                    <Fragment>
                        <h4>Results</h4>
                        {output.toString()}
                    </Fragment>
                }
            </form>
        </div>;
    }
}

class ConfirmationsForm4 extends Component {
    constructor(props){
        super(props);
        this.state = {
            input: {
                field: '',
                field: ''
            },
            output: null,
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
            const result = await MultiSigWalletWithDailyLimit.methods.confirmations(input.field, input.field).call();
            this.setState({output: result});


        } catch(err) {
            console.error(err);
            this.setState({error: err.message});
        }
    }

    render(){
        const {input, value, error, output, receipt} = this.state;

        return <div className="formSection">
            <h3>confirmations</h3>
            <form>
                <FormGroup>
                    <ControlLabel>field</ControlLabel>
                    <FormControl
                        type="text"
                        defaultValue={ input.field }
                        placeholder="uint256"
                        onChange={(e) => this.handleChange(e, 'field')}
                    />
                </FormGroup>
                <FormGroup>
                    <ControlLabel>field</ControlLabel>
                    <FormControl
                        type="text"
                        defaultValue={ input.field }
                        placeholder="address"
                        onChange={(e) => this.handleChange(e, 'field')}
                    />
                </FormGroup>

                { error != null && <Alert bsStyle="danger">{error}</Alert> }

                <Button type="submit" bsStyle="primary" onClick={(e) => this.handleClick(e)}>Call</Button>
                {
                    output &&
                    <Fragment>
                        <h4>Results</h4>
                        {output.toString()}
                    </Fragment>
                }
            </form>
        </div>;
    }
}

class CalcMaxWithdrawForm5 extends Component {
    constructor(props){
        super(props);
        this.state = {
            output: null,
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
            const result = await MultiSigWalletWithDailyLimit.methods.calcMaxWithdraw().call();
            this.setState({output: result});


        } catch(err) {
            console.error(err);
            this.setState({error: err.message});
        }
    }

    render(){
        const {input, value, error, output, receipt} = this.state;

        return <div className="formSection">
            <h3>calcMaxWithdraw</h3>
            <form>

                { error != null && <Alert bsStyle="danger">{error}</Alert> }

                <Button type="submit" bsStyle="primary" onClick={(e) => this.handleClick(e)}>Call</Button>
                {
                    output &&
                    <Fragment>
                        <h4>Results</h4>
                        {output.toString()}
                    </Fragment>
                }
            </form>
        </div>;
    }
}

class GetTransactionCountForm6 extends Component {
    constructor(props){
        super(props);
        this.state = {
            input: {
                pending: false,
                executed: false
            },
            output: null,
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
            const result = await MultiSigWalletWithDailyLimit.methods.getTransactionCount(input.pending, input.executed).call();
            this.setState({output: result});


        } catch(err) {
            console.error(err);
            this.setState({error: err.message});
        }
    }

    render(){
        const {input, value, error, output, receipt} = this.state;

        return <div className="formSection">
            <h3>getTransactionCount</h3>
            <form>
                <FormGroup>
                    <ControlLabel>pending</ControlLabel>
                    <Checkbox
                        onClick={(e) => this.handleCheckbox(e, 'pending')}
                    />
                </FormGroup>
                <FormGroup>
                    <ControlLabel>executed</ControlLabel>
                    <Checkbox
                        onClick={(e) => this.handleCheckbox(e, 'executed')}
                    />
                </FormGroup>

                { error != null && <Alert bsStyle="danger">{error}</Alert> }

                <Button type="submit" bsStyle="primary" onClick={(e) => this.handleClick(e)}>Call</Button>
                {
                    output &&
                    <Fragment>
                        <h4>Results</h4>
                        {output.toString()}
                    </Fragment>
                }
            </form>
        </div>;
    }
}

class DailyLimitForm7 extends Component {
    constructor(props){
        super(props);
        this.state = {
            output: null,
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
            const result = await MultiSigWalletWithDailyLimit.methods.dailyLimit().call();
            this.setState({output: result});


        } catch(err) {
            console.error(err);
            this.setState({error: err.message});
        }
    }

    render(){
        const {input, value, error, output, receipt} = this.state;

        return <div className="formSection">
            <h3>dailyLimit</h3>
            <form>

                { error != null && <Alert bsStyle="danger">{error}</Alert> }

                <Button type="submit" bsStyle="primary" onClick={(e) => this.handleClick(e)}>Call</Button>
                {
                    output &&
                    <Fragment>
                        <h4>Results</h4>
                        {output.toString()}
                    </Fragment>
                }
            </form>
        </div>;
    }
}

class LastDayForm8 extends Component {
    constructor(props){
        super(props);
        this.state = {
            output: null,
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
            const result = await MultiSigWalletWithDailyLimit.methods.lastDay().call();
            this.setState({output: result});


        } catch(err) {
            console.error(err);
            this.setState({error: err.message});
        }
    }

    render(){
        const {input, value, error, output, receipt} = this.state;

        return <div className="formSection">
            <h3>lastDay</h3>
            <form>

                { error != null && <Alert bsStyle="danger">{error}</Alert> }

                <Button type="submit" bsStyle="primary" onClick={(e) => this.handleClick(e)}>Call</Button>
                {
                    output &&
                    <Fragment>
                        <h4>Results</h4>
                        {output.toString()}
                    </Fragment>
                }
            </form>
        </div>;
    }
}

class AddOwnerForm9 extends Component {
    constructor(props){
        super(props);
        this.state = {
            input: {
                owner: ''
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

            const toSend = MultiSigWalletWithDailyLimit.methods.addOwner(input.owner);

            const estimatedGas = await toSend.estimateGas({from: web3.eth.defaultAccount});

            const receipt = await toSend.send({
                from: web3.eth.defaultAccount,
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
            <h3>addOwner</h3>
            <form>
                <FormGroup>
                    <ControlLabel>owner</ControlLabel>
                    <FormControl
                        type="text"
                        defaultValue={ input.owner }
                        placeholder="address"
                        onChange={(e) => this.handleChange(e, 'owner')}
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

class IsConfirmedForm10 extends Component {
    constructor(props){
        super(props);
        this.state = {
            input: {
                transactionId: ''
            },
            output: null,
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
            const result = await MultiSigWalletWithDailyLimit.methods.isConfirmed(input.transactionId).call();
            this.setState({output: result});


        } catch(err) {
            console.error(err);
            this.setState({error: err.message});
        }
    }

    render(){
        const {input, value, error, output, receipt} = this.state;

        return <div className="formSection">
            <h3>isConfirmed</h3>
            <form>
                <FormGroup>
                    <ControlLabel>transactionId</ControlLabel>
                    <FormControl
                        type="text"
                        defaultValue={ input.transactionId }
                        placeholder="uint256"
                        onChange={(e) => this.handleChange(e, 'transactionId')}
                    />
                </FormGroup>

                { error != null && <Alert bsStyle="danger">{error}</Alert> }

                <Button type="submit" bsStyle="primary" onClick={(e) => this.handleClick(e)}>Call</Button>
                {
                    output &&
                    <Fragment>
                        <h4>Results</h4>
                        {output.toString()}
                    </Fragment>
                }
            </form>
        </div>;
    }
}

class GetConfirmationCountForm11 extends Component {
    constructor(props){
        super(props);
        this.state = {
            input: {
                transactionId: ''
            },
            output: null,
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
            const result = await MultiSigWalletWithDailyLimit.methods.getConfirmationCount(input.transactionId).call();
            this.setState({output: result});


        } catch(err) {
            console.error(err);
            this.setState({error: err.message});
        }
    }

    render(){
        const {input, value, error, output, receipt} = this.state;

        return <div className="formSection">
            <h3>getConfirmationCount</h3>
            <form>
                <FormGroup>
                    <ControlLabel>transactionId</ControlLabel>
                    <FormControl
                        type="text"
                        defaultValue={ input.transactionId }
                        placeholder="uint256"
                        onChange={(e) => this.handleChange(e, 'transactionId')}
                    />
                </FormGroup>

                { error != null && <Alert bsStyle="danger">{error}</Alert> }

                <Button type="submit" bsStyle="primary" onClick={(e) => this.handleClick(e)}>Call</Button>
                {
                    output &&
                    <Fragment>
                        <h4>Results</h4>
                        {output.toString()}
                    </Fragment>
                }
            </form>
        </div>;
    }
}

class TransactionsForm12 extends Component {
    constructor(props){
        super(props);
        this.state = {
            input: {
                field: ''
            },
            output: null,
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
            const result = await MultiSigWalletWithDailyLimit.methods.transactions(input.field).call();
            this.setState({output: {
                destination: result[0],
                value: result[1],
                data: result[2],
                executed: result[3]
            }});


        } catch(err) {
            console.error(err);
            this.setState({error: err.message});
        }
    }

    render(){
        const {input, value, error, output, receipt} = this.state;

        return <div className="formSection">
            <h3>transactions</h3>
            <form>
                <FormGroup>
                    <ControlLabel>field</ControlLabel>
                    <FormControl
                        type="text"
                        defaultValue={ input.field }
                        placeholder="uint256"
                        onChange={(e) => this.handleChange(e, 'field')}
                    />
                </FormGroup>

                { error != null && <Alert bsStyle="danger">{error}</Alert> }

                <Button type="submit" bsStyle="primary" onClick={(e) => this.handleClick(e)}>Call</Button>
                {
                    output &&
                    <Fragment>
                        <h4>Results</h4>
                        <ul>
                            <li>destination: { JSON.stringify(output.destination) }</li>
                            <li>value: { JSON.stringify(output.value) }</li>
                            <li>data: { JSON.stringify(output.data) }</li>
                            <li>executed: { JSON.stringify(output.executed) }</li>
                        </ul>
                    </Fragment>
                }
            </form>
        </div>;
    }
}

class GetOwnersForm13 extends Component {
    constructor(props){
        super(props);
        this.state = {
            output: null,
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
            const result = await MultiSigWalletWithDailyLimit.methods.getOwners().call();
            this.setState({output: result});


        } catch(err) {
            console.error(err);
            this.setState({error: err.message});
        }
    }

    render(){
        const {input, value, error, output, receipt} = this.state;

        return <div className="formSection">
            <h3>getOwners</h3>
            <form>

                { error != null && <Alert bsStyle="danger">{error}</Alert> }

                <Button type="submit" bsStyle="primary" onClick={(e) => this.handleClick(e)}>Call</Button>
                {
                    output &&
                    <Fragment>
                        <h4>Results</h4>
                        {output.toString()}
                    </Fragment>
                }
            </form>
        </div>;
    }
}

class GetTransactionIdsForm14 extends Component {
    constructor(props){
        super(props);
        this.state = {
            input: {
                from: '',
                to: '',
                pending: false,
                executed: false
            },
            output: null,
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
            const result = await MultiSigWalletWithDailyLimit.methods.getTransactionIds(input.from, input.to, input.pending, input.executed).call();
            this.setState({output: result});


        } catch(err) {
            console.error(err);
            this.setState({error: err.message});
        }
    }

    render(){
        const {input, value, error, output, receipt} = this.state;

        return <div className="formSection">
            <h3>getTransactionIds</h3>
            <form>
                <FormGroup>
                    <ControlLabel>from</ControlLabel>
                    <FormControl
                        type="text"
                        defaultValue={ input.from }
                        placeholder="uint256"
                        onChange={(e) => this.handleChange(e, 'from')}
                    />
                </FormGroup>
                <FormGroup>
                    <ControlLabel>to</ControlLabel>
                    <FormControl
                        type="text"
                        defaultValue={ input.to }
                        placeholder="uint256"
                        onChange={(e) => this.handleChange(e, 'to')}
                    />
                </FormGroup>
                <FormGroup>
                    <ControlLabel>pending</ControlLabel>
                    <Checkbox
                        onClick={(e) => this.handleCheckbox(e, 'pending')}
                    />
                </FormGroup>
                <FormGroup>
                    <ControlLabel>executed</ControlLabel>
                    <Checkbox
                        onClick={(e) => this.handleCheckbox(e, 'executed')}
                    />
                </FormGroup>

                { error != null && <Alert bsStyle="danger">{error}</Alert> }

                <Button type="submit" bsStyle="primary" onClick={(e) => this.handleClick(e)}>Call</Button>
                {
                    output &&
                    <Fragment>
                        <h4>Results</h4>
                        {output.toString()}
                    </Fragment>
                }
            </form>
        </div>;
    }
}

class GetConfirmationsForm15 extends Component {
    constructor(props){
        super(props);
        this.state = {
            input: {
                transactionId: ''
            },
            output: null,
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
            const result = await MultiSigWalletWithDailyLimit.methods.getConfirmations(input.transactionId).call();
            this.setState({output: result});


        } catch(err) {
            console.error(err);
            this.setState({error: err.message});
        }
    }

    render(){
        const {input, value, error, output, receipt} = this.state;

        return <div className="formSection">
            <h3>getConfirmations</h3>
            <form>
                <FormGroup>
                    <ControlLabel>transactionId</ControlLabel>
                    <FormControl
                        type="text"
                        defaultValue={ input.transactionId }
                        placeholder="uint256"
                        onChange={(e) => this.handleChange(e, 'transactionId')}
                    />
                </FormGroup>

                { error != null && <Alert bsStyle="danger">{error}</Alert> }

                <Button type="submit" bsStyle="primary" onClick={(e) => this.handleClick(e)}>Call</Button>
                {
                    output &&
                    <Fragment>
                        <h4>Results</h4>
                        {output.toString()}
                    </Fragment>
                }
            </form>
        </div>;
    }
}

class TransactionCountForm16 extends Component {
    constructor(props){
        super(props);
        this.state = {
            output: null,
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
            const result = await MultiSigWalletWithDailyLimit.methods.transactionCount().call();
            this.setState({output: result});


        } catch(err) {
            console.error(err);
            this.setState({error: err.message});
        }
    }

    render(){
        const {input, value, error, output, receipt} = this.state;

        return <div className="formSection">
            <h3>transactionCount</h3>
            <form>

                { error != null && <Alert bsStyle="danger">{error}</Alert> }

                <Button type="submit" bsStyle="primary" onClick={(e) => this.handleClick(e)}>Call</Button>
                {
                    output &&
                    <Fragment>
                        <h4>Results</h4>
                        {output.toString()}
                    </Fragment>
                }
            </form>
        </div>;
    }
}

class ChangeRequirementForm17 extends Component {
    constructor(props){
        super(props);
        this.state = {
            input: {
                _required: ''
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

            const toSend = MultiSigWalletWithDailyLimit.methods.changeRequirement(input._required);

            const estimatedGas = await toSend.estimateGas({from: web3.eth.defaultAccount});

            const receipt = await toSend.send({
                from: web3.eth.defaultAccount,
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
            <h3>changeRequirement</h3>
            <form>
                <FormGroup>
                    <ControlLabel>_required</ControlLabel>
                    <FormControl
                        type="text"
                        defaultValue={ input._required }
                        placeholder="uint256"
                        onChange={(e) => this.handleChange(e, '_required')}
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

class ConfirmTransactionForm18 extends Component {
    constructor(props){
        super(props);
        this.state = {
            input: {
                transactionId: ''
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

            const toSend = MultiSigWalletWithDailyLimit.methods.confirmTransaction(input.transactionId);

            const estimatedGas = await toSend.estimateGas({from: web3.eth.defaultAccount});

            const receipt = await toSend.send({
                from: web3.eth.defaultAccount,
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
            <h3>confirmTransaction</h3>
            <form>
                <FormGroup>
                    <ControlLabel>transactionId</ControlLabel>
                    <FormControl
                        type="text"
                        defaultValue={ input.transactionId }
                        placeholder="uint256"
                        onChange={(e) => this.handleChange(e, 'transactionId')}
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

class SubmitTransactionForm19 extends Component {
    constructor(props){
        super(props);
        this.state = {
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

            const toSend = MultiSigWalletWithDailyLimit.methods.submitTransaction(input.destination, input.value, input.data);

            const estimatedGas = await toSend.estimateGas({from: web3.eth.defaultAccount});

            const receipt = await toSend.send({
                from: web3.eth.defaultAccount,
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

class ChangeDailyLimitForm20 extends Component {
    constructor(props){
        super(props);
        this.state = {
            input: {
                _dailyLimit: ''
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

            const toSend = MultiSigWalletWithDailyLimit.methods.changeDailyLimit(input._dailyLimit);

            const estimatedGas = await toSend.estimateGas({from: web3.eth.defaultAccount});

            const receipt = await toSend.send({
                from: web3.eth.defaultAccount,
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
            <h3>changeDailyLimit</h3>
            <form>
                <FormGroup>
                    <ControlLabel>_dailyLimit</ControlLabel>
                    <FormControl
                        type="text"
                        defaultValue={ input._dailyLimit }
                        placeholder="uint256"
                        onChange={(e) => this.handleChange(e, '_dailyLimit')}
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

class MAX_OWNER_COUNTForm21 extends Component {
    constructor(props){
        super(props);
        this.state = {
            output: null,
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
            const result = await MultiSigWalletWithDailyLimit.methods.MAX_OWNER_COUNT().call();
            this.setState({output: result});


        } catch(err) {
            console.error(err);
            this.setState({error: err.message});
        }
    }

    render(){
        const {input, value, error, output, receipt} = this.state;

        return <div className="formSection">
            <h3>MAX_OWNER_COUNT</h3>
            <form>

                { error != null && <Alert bsStyle="danger">{error}</Alert> }

                <Button type="submit" bsStyle="primary" onClick={(e) => this.handleClick(e)}>Call</Button>
                {
                    output &&
                    <Fragment>
                        <h4>Results</h4>
                        {output.toString()}
                    </Fragment>
                }
            </form>
        </div>;
    }
}

class RequiredForm22 extends Component {
    constructor(props){
        super(props);
        this.state = {
            output: null,
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
            const result = await MultiSigWalletWithDailyLimit.methods.required().call();
            this.setState({output: result});


        } catch(err) {
            console.error(err);
            this.setState({error: err.message});
        }
    }

    render(){
        const {input, value, error, output, receipt} = this.state;

        return <div className="formSection">
            <h3>required</h3>
            <form>

                { error != null && <Alert bsStyle="danger">{error}</Alert> }

                <Button type="submit" bsStyle="primary" onClick={(e) => this.handleClick(e)}>Call</Button>
                {
                    output &&
                    <Fragment>
                        <h4>Results</h4>
                        {output.toString()}
                    </Fragment>
                }
            </form>
        </div>;
    }
}

class ReplaceOwnerForm23 extends Component {
    constructor(props){
        super(props);
        this.state = {
            input: {
                owner: '',
                newOwner: ''
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

            const toSend = MultiSigWalletWithDailyLimit.methods.replaceOwner(input.owner, input.newOwner);

            const estimatedGas = await toSend.estimateGas({from: web3.eth.defaultAccount});

            const receipt = await toSend.send({
                from: web3.eth.defaultAccount,
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
            <h3>replaceOwner</h3>
            <form>
                <FormGroup>
                    <ControlLabel>owner</ControlLabel>
                    <FormControl
                        type="text"
                        defaultValue={ input.owner }
                        placeholder="address"
                        onChange={(e) => this.handleChange(e, 'owner')}
                    />
                </FormGroup>
                <FormGroup>
                    <ControlLabel>newOwner</ControlLabel>
                    <FormControl
                        type="text"
                        defaultValue={ input.newOwner }
                        placeholder="address"
                        onChange={(e) => this.handleChange(e, 'newOwner')}
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

class ExecuteTransactionForm24 extends Component {
    constructor(props){
        super(props);
        this.state = {
            input: {
                transactionId: ''
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

            const toSend = MultiSigWalletWithDailyLimit.methods.executeTransaction(input.transactionId);

            const estimatedGas = await toSend.estimateGas({from: web3.eth.defaultAccount});

            const receipt = await toSend.send({
                from: web3.eth.defaultAccount,
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
            <h3>executeTransaction</h3>
            <form>
                <FormGroup>
                    <ControlLabel>transactionId</ControlLabel>
                    <FormControl
                        type="text"
                        defaultValue={ input.transactionId }
                        placeholder="uint256"
                        onChange={(e) => this.handleChange(e, 'transactionId')}
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

class SpentTodayForm25 extends Component {
    constructor(props){
        super(props);
        this.state = {
            output: null,
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
            const result = await MultiSigWalletWithDailyLimit.methods.spentToday().call();
            this.setState({output: result});


        } catch(err) {
            console.error(err);
            this.setState({error: err.message});
        }
    }

    render(){
        const {input, value, error, output, receipt} = this.state;

        return <div className="formSection">
            <h3>spentToday</h3>
            <form>

                { error != null && <Alert bsStyle="danger">{error}</Alert> }

                <Button type="submit" bsStyle="primary" onClick={(e) => this.handleClick(e)}>Call</Button>
                {
                    output &&
                    <Fragment>
                        <h4>Results</h4>
                        {output.toString()}
                    </Fragment>
                }
            </form>
        </div>;
    }
}


function MultiSigWalletWithDailyLimitUI(props) {
    return (<div>
            <h1>MultiSigWalletWithDailyLimit</h1>
            <OwnersForm0 />
            <RemoveOwnerForm1 />
            <RevokeConfirmationForm2 />
            <IsOwnerForm3 />
            <ConfirmationsForm4 />
            <CalcMaxWithdrawForm5 />
            <GetTransactionCountForm6 />
            <DailyLimitForm7 />
            <LastDayForm8 />
            <AddOwnerForm9 />
            <IsConfirmedForm10 />
            <GetConfirmationCountForm11 />
            <TransactionsForm12 />
            <GetOwnersForm13 />
            <GetTransactionIdsForm14 />
            <GetConfirmationsForm15 />
            <TransactionCountForm16 />
            <ChangeRequirementForm17 />
            <ConfirmTransactionForm18 />
            <SubmitTransactionForm19 />
            <ChangeDailyLimitForm20 />
            <MAX_OWNER_COUNTForm21 />
            <RequiredForm22 />
            <ReplaceOwnerForm23 />
            <ExecuteTransactionForm24 />
            <SpentTodayForm25 />
        </div>);
}


ReactDOM.render(<MultiSigWalletWithDailyLimitUI />, document.getElementById('app'));
