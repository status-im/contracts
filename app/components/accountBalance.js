import Web3 from 'web3';

import React from 'react';
import { Grid, Row, Form, FormGroup, FormControl, HelpBlock, Button, ControlLabel, Col, InputGroup, Alert } from 'react-bootstrap';
 
class AccountBalance extends React.Component {

    constructor(props) {
        super(props);
  
        this.state = {
            eth: 0,
            rnd: 0
        };
    }

    async updateBalances(ev){
        ev.preventDefault();
        this.setState({
            eth: await this.props.web3.eth.getBalance(this.props.address),
            rnd: await this.props.RND.methods.balanceOf(this.props.address).call()
        });
    }

    render(){
        return <div>
              <h3>{this.props.name}</h3>
              <small>{this.props.address}</small>
              <p><b>RDN</b><br /><small>{this.state.rnd}</small></p>
              <p><b>ETH</b><br /><small>{this.state.eth}</small></p>
              <a href="#" onClick={(ev) => this.updateBalances(ev)}>Update balances</a>
            </div>;
    }
};

export default AccountBalance;