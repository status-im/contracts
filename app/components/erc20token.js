import EmbarkJS from 'Embark/EmbarkJS';
import ERC20Token from 'Embark/contracts/ERC20Token';
import React from 'react';
import { connect } from 'react-redux';
import { Form, FormGroup, FormControl, HelpBlock, Button } from 'react-bootstrap';
import { getCurrentAccount, accountsIsLoading } from '../reducers/accounts';
 
class ERC20TokenUI extends React.Component {

    constructor(props) {
      super(props);
      ERC20Token.options.address = props.address;
      this.state = {
        balanceOf: 0,
        transferTo: "",
        transferAmount: 0,
        accountBalance: 0,
        accountB: web3.eth.defaultAccount,
      }      
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
  
    getDefaultAccountBalance(){
      if (EmbarkJS.isNewWeb3()) {
        ERC20Token.methods.balanceOf(web3.eth.defaultAccount).call()
          .then(_value => this.setState({accountBalance: _value}))
      } else {
        ERC20Token.balanceOf(web3.eth.defaultAccount)
          .then(_value => this.x({valueGet: _value}))
      }
      this._addToLog(ERC20Token.options.address + ".balanceOf(" + web3.eth.defaultAccount + ")");
    }

    _addToLog(txt){
      console.log(txt);
    }
  
  render() {
    const { account, isLoading } = this.props;
    return (
      <React.Fragment>
        <h3> Read your account token balance </h3>
        <Form inline>
          <FormGroup>
            {!isLoading && <HelpBlock>Your test token balance is <span className="accountBalance">{account.ERC20TokenBalance}</span></HelpBlock>}
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
        
      </React.Fragment>
    );
  }
  }

const mapStateToProps = state => ({
  account: getCurrentAccount(state),
  isLoading: accountsIsLoading(state),
});

export default connect(mapStateToProps)(ERC20TokenUI);
