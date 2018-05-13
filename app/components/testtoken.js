import EmbarkJS from 'Embark/EmbarkJS';
import TestToken from 'Embark/contracts/TestToken';
import React from 'react';
import { Form, FormGroup, FormControl, HelpBlock, Button } from 'react-bootstrap';
 
class TestTokenUI extends React.Component {

    constructor(props) {
      super(props);
      this.state = {
        amountToMint: 100,
        accountBalance: 0,
        accountB: web3.eth.defaultAccount,
        balanceOf: 0,
        logs: []
      }      
    }
  
    handleMintAmountChange(e){
      this.setState({amountToMint: e.target.value});
    }
    
    mint(e){
      e.preventDefault();
  
      var value = parseInt(this.state.amountToMint, 10);
  
      // If web3.js 1.0 is being used
      if (EmbarkJS.isNewWeb3()) {
        TestToken.methods.mint(value).send({from: web3.eth.defaultAccount});
        this._addToLog("TestToken.methods.mint("+value+").send({from: " + web3.eth.defaultAccount + "})");
      } else {
        TestToken.mint(value);
        this._addToLog("#blockchain", "TestToken.mint(" + value + ")");
      }
    }
  
    getBalance(e){
      e.preventDefault();
      
      if (EmbarkJS.isNewWeb3()) {
        TestToken.methods.balanceOf(web3.eth.defaultAccount).call()
          .then(_value => this.setState({accountBalance: _value}))
      } else {
        TestToken.balanceOf(web3.eth.defaultAccount)
          .then(_value => this.x({valueGet: _value}))
      }
      this._addToLog(TestToken.options.address + ".balanceOf(" + web3.eth.defaultAccount + ")");
    }
  
    _addToLog(txt){
      this.state.logs.push(txt);
      this.setState({logs: this.state.logs});
    }
  
    render(){
      return (<React.Fragment>
          <h3> 1. Mint Test Token</h3>
          <Form inline>
            <FormGroup>
              <FormControl
                type="text"
                defaultValue={this.state.amountToMint}
                onChange={(e) => this.handleMintAmountChange(e)} />
              <Button bsStyle="primary" onClick={(e) => this.mint(e)}>Mint</Button>
            </FormGroup>
          </Form>
          
          <h3> 2. Read your account token balance </h3>
          <Form inline>
            <FormGroup>
              <HelpBlock>Your test token balance is <span className="accountBalance">{this.state.accountBalance}</span></HelpBlock>
              <Button bsStyle="primary" onClick={(e) => this.getBalance(e)}>Get Balance</Button>
            </FormGroup>
          </Form>
     
          <h3> 3. Contract Calls </h3>
          <p>Javascript calls being made: </p>
          <div className="logs">
          {
            this.state.logs.map((item, i) => <p key={i}>{item}</p>)
          }
          </div>
      </React.Fragment>
      );
    }
  }

  export default TestTokenUI;