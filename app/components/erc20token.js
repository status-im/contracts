import EmbarkJS from 'Embark/EmbarkJS';
import ERC20Token from 'Embark/contracts/ERC20Token';
import React from 'react';
import { Form, FormGroup, FormControl, HelpBlock, Button } from 'react-bootstrap';
 
class ERC20TokenUI extends React.Component {

    constructor(props) {
      super(props);
      this.state = {

        balanceOf: 0,
        transferTo: "",
        transferAmount: 0,
        logs: []
      }      
    }  
    
    contractAddress(e){
      e.preventDefault();
      var tokenAddress = e.target.value;
      ERC20Token.options.address = tokenAddress;
    }

    update_transferTo(e){
      this.setState({transferTo: e.target.value});
    }

    update_transferAmount(e){
      this.setState({transferAmount: e.target.value});
    }

    transfer(e){
      var to = this.state.transferTo;
      var amount = this.state.transferAmount;
      var tx = ERC20Token.methods.transfer(to, amount).send({from: web3.eth.defaultAccount});
      this._addToLog(ERC20Token.options.address+".transfer(" + to + ", "+amount+")");
    }

    approve(e){
      var to = this.state.transferTo;
      var amount = this.state.transferAmount;
      var tx = ERC20Token.methods.approve(to, amount).send({from: web3.eth.defaultAccount});
      this._addToLog(ERC20Token.options.address+".approve(" + to + ", "+amount+")");
    }

    balanceOf(e){
      e.preventDefault();
      var who = e.target.value;
      if (EmbarkJS.isNewWeb3()) {
        ERC20Token.methods.balanceOf(who).call()
          .then(_value => this.setState({balanceOf: _value}))
        
      } else {
        ERC20Token.balanceOf(who)
          .then(_value => this.x({balanceOf: _value}));
      }
      this._addToLog(ERC20Token.options.address+".balanceOf(" + who + ")");
    }
  

    _addToLog(txt){
      this.state.logs.push(txt);
      this.setState({logs: this.state.logs});
    }
  
    render(){
      return (<React.Fragment>
     
          <h2> Set token contract address</h2>
          <Form inline>
            <FormGroup>
              <FormControl
                type="text"
                onChange={(e) => this.contractAddress(e)} />
            </FormGroup>
          </Form>

          
          <h3> Read account token balance</h3>
          <Form inline>
            <FormGroup>
              <label>
                Of:
                <FormControl
                  type="text"
                  defaultValue={this.state.accountB}
                  onChange={(e) => this.balanceOf(e)} />
              </label>
              <label>
                <HelpBlock><span className="balanceOf">{this.state.balanceOf}</span></HelpBlock>
              </label>
              
            </FormGroup>
          </Form>

          <h3> Transfer/Approve token balance</h3>
          <Form inline>
            <FormGroup>
              <label>
                To:
                <FormControl
                  type="text"
                  defaultValue={this.state.transferTo}
                  onChange={(e) => this.update_transferTo(e) } />
              </label>
              <label>
                Amount:
                <FormControl
                  type="text"
                  defaultValue={this.state.transferAmount}
                  onChange={(e) => this.update_transferAmount(e) } />
              </label>
              <Button bsStyle="primary" onClick={(e) => this.transfer(e)}>Transfer</Button>
              <Button bsStyle="primary" onClick={(e) => this.approve(e)}>Approve</Button>
            </FormGroup>
          </Form>
     
          <h3> Contract Calls </h3>
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

  export default ERC20TokenUI;