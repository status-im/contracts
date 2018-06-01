import EmbarkJS from 'Embark/EmbarkJS';
import SNT from 'Embark/contracts/SNT';
import React from 'react';
import { Form, FormGroup, FormControl, HelpBlock, Button } from 'react-bootstrap';
import web3 from "Embark/web3"

class SNTUI extends React.Component {

    constructor(props) {
      super(props);
      this.state = {
        address: "",
        amountToMint: 100,
        accountBalance: 0,
        accountB: web3.eth.defaultAccount,
        balanceOf: 0,
        logs: []
      }
    }

    componentDidMount(){
      __embarkContext.execWhenReady(async () => {
        this.setState({address: web3.eth.defaultAccount});
      });
    }
  
    handleMintAmountChange(e){
      this.setState({amountToMint: e.target.value});
    }
    
    mint(e){
      e.preventDefault();
  
      var value = parseInt(this.state.amountToMint, 10);
      var address = this.state.address;

      SNT.methods.controller().call()
        .then((controller) => {
          return SNT.methods.generateTokens(address, value)
            .send({from: controller, gasLimit: 1000000});
         })
        .then(console.log);
   
      this._addToLog(SNT.options.address +".mint("+value+").send({from: " + web3.eth.defaultAccount + "})");
    }
  
    getBalance(e){
      e.preventDefault();
      
      if (EmbarkJS.isNewWeb3()) {
        SNT.methods.balanceOf(web3.eth.defaultAccount).call()
          .then(_value => this.setState({accountBalance: _value}))
      } else {
        SNT.balanceOf(web3.eth.defaultAccount)
          .then(_value => this.x({valueGet: _value}))
      }
      this._addToLog(SNT.options.address + ".balanceOf(" + web3.eth.defaultAccount + ")");
    }
  
    _addToLog(txt){
      this.state.logs.push(txt);
      this.setState({logs: this.state.logs});
    }
  
    render(){
      return (<React.Fragment>
          <h3> 1. Mint SNT Token</h3>
          <Form inline>
            <FormGroup>
              <FormControl
                type="text"
                value={this.state.address}
                onChange={(e) => this.setState({address: e.target.value}) } />
            </FormGroup>
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

  export default SNTUI;