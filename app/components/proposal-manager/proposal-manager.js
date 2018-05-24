import EmbarkJS from 'Embark/EmbarkJS';
import ERC20Token from 'Embark/contracts/ERC20Token';
import ProposalCuration from 'Embark/contracts/ProposalCuration'
import React, { Fragment } from 'react';
import { Form, FormGroup, FormControl, HelpBlock, Button } from 'react-bootstrap';
import web3 from "Embark/web3"

class ProposalManager extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            submitPrice: "Loading...",
            to: "",
            value: "",
            data: "",
            description: "",
            topic: "0x00"
        };
        window['ProposalCuration'] = ProposalCuration;
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
                    balance: _b
                });
            } catch(err){
                console.log("Couldn't get submit price")
            }
        });
    }

    render(){
        return (
            <Fragment>
            <h2>Add</h2>
            <h3>Price for submitting proposals: {this.state.submitPrice}</h3>
            <Form>
            <FormGroup>
              <label>
                To:
                <FormControl
                  type="text"
                  defaultValue={this.state.to}
                  onChange={(e) => this.setState({to: e.target.value }) } />
              </label>
            </FormGroup>
            <FormGroup>
              <label>
                Value:
                <FormControl
                  type="text"
                  defaultValue={this.state.value}
                  onChange={(e) => this.setState({value: e.target.value }) } />
              </label>
            </FormGroup>
            <FormGroup>
              <label>
                Data:
                <FormControl
                  type="text"
                  defaultValue={this.state.data}
                  onChange={(e) => this.setState({value: e.target.value }) } />
              </label>
            </FormGroup>
            <FormGroup>
              <label>
                Topic:
                <FormControl
                  type="text"
                  defaultValue={this.state.topic} 
                  readOnly={true} />
              </label>
            </FormGroup>
            <FormGroup>
              <label>
                Description:
                <FormControl
                  type="text"
                  defaultValue={this.state.description}
                  onChange={(e) => this.setState({value: e.target.value }) } />
              </label>
            </FormGroup>
          </Form>
            </Fragment>
        )
    }
}

export default ProposalManager;
