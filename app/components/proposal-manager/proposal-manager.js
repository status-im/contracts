import EmbarkJS from 'Embark/EmbarkJS';
import ERC20Token from 'Embark/contracts/ERC20Token';
import ProposalCuration from 'Embark/contracts/ProposalCuration';
import SNT from 'Embark/contracts/SNT';
import React, { Component, Fragment } from 'react';
import { Form, FormGroup, FormControl, HelpBlock, Button, Alert } from 'react-bootstrap';
import web3 from "Embark/web3"

class ProposalManager extends Component {

    constructor(props) {
        super(props);
        this.state = {
            submitPrice: "Loading...",
            url: "",
            title: "",
            description: "",
            canSubmit: true
        };
    }

    componentDidMount(){
        this.loadPrice();
    }

    componentWillReceiveProps(){
        this.loadPrice();
    }

    async loadPrice(){
        __embarkContext.execWhenReady(async () => {
           try {
                let _b = await ProposalCuration.methods.getSubmitPrice(web3.eth.defaultAccount).call();
                this.setState({
                    submitPrice: _b,
                    canSubmit: true
                });
            } catch(err){
                this.setState({
                    canSubmit: false, 
                    submitPrice: "-"
                });
            }
        });
    }

    async handleClick(){
        let description = {
            "url": this.state.url,
            "title": this.state.title,
            "description": this.state.description
        };

        EmbarkJS.Storage.saveText(JSON.stringify(description))
            .then(async (hash) => {
                let hexHash = web3.utils.toHex(hash);

                let receipt = await SNT.methods.approve(
                            ProposalCuration.options.address, 
                            this.state.submitPrice)
                        .send({from: web3.eth.defaultAccount, gasLimit: 1000000});

                console.log(receipt);

                receipt = await ProposalCuration.methods.submitProposal(
                "0x00",
                "0x0000000000000000000000000000000000000000", 
                0, 
                "0x00", 
                hexHash
                )
                .send({from: web3.eth.defaultAccount, gasLimit: 1000000});

                console.log(receipt);
                })
            .catch((err) => {
                if(err){
                    // TODO show error
                    console.log("Storage saveText Error => " + err.message);
                }
            });
    }
    

    render(){
        return (
            <Fragment>
            {
                !this.state.canSubmit ?
                <Alert bsStyle="warning">
                Account not allowed to submit proposals
                </Alert>
                : ''
            }
            <h2>Add proposal</h2>
            <h3>Price: {this.state.submitPrice}</h3>
            <Form>
                <FormGroup>
                <label>
                    Title:
                    <FormControl
                    type="text"
                    defaultValue={this.state.title}
                    onChange={(e) => this.setState({title: e.target.value }) } />
                </label>
                </FormGroup>
                <FormGroup>
                <label>
                    Description:
                    <FormControl
                    type="text"
                    defaultValue={this.state.description}
                    onChange={(e) => this.setState({description: e.target.value }) } />
                </label>
                </FormGroup>
                <FormGroup>
                <label>
                    URL:
                    <FormControl
                    type="text"
                    defaultValue={this.state.url}
                    onChange={(e) => this.setState({url: e.target.value }) } />
                </label>
                </FormGroup>
                {
                    this.state.canSubmit ?
                    <FormGroup>
                        <Button onClick={(e) => this.handleClick(e)}>Submit</Button>
                    </FormGroup>
                    : ''
                }
          </Form>
        </Fragment>
        )
    }
}

export default ProposalManager;
