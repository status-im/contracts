import EmbarkJS from 'Embark/EmbarkJS';
import StatusRoot from 'Embark/contracts/StatusRoot';
import MiniMeToken from 'Embark/contracts/MiniMeToken';
import React from 'react';
import { Form, FormGroup, FormControl, HelpBlock, Button } from 'react-bootstrap';
import ERC20TokenUI from './erc20token';
import { connect } from 'react-redux';
import { actions as accountActions } from '../reducers/accounts';

class TestTokenUI extends React.Component {

    constructor(props) {
      super(props);
      this.state = {
        amountToMint: 100,
      }      
    }
  
    handleMintAmountChange(e){
      this.setState({amountToMint: e.target.value});
    }
    
  mint(e){
    const { addToBalance } = this.props;
      e.preventDefault();
  
      var value = parseInt(this.state.amountToMint, 10);
      StatusRoot.methods.mint(value).send({from: web3.eth.defaultAccount})
        .then(r => { addToBalance(value) });

      console.log(StatusRoot.options.address +".mint("+value+").send({from: " + web3.eth.defaultAccount + "})");
    }
    
    render(){
      return (<React.Fragment>
          <h3> Mint Test Token</h3>
          <Form inline>
            <FormGroup>
              <FormControl
                type="text"
                defaultValue={this.state.amountToMint}
                onChange={(e) => this.handleMintAmountChange(e)} />
              <Button bsStyle="primary" onClick={(e) => this.mint(e)}>Mint</Button>
            </FormGroup>
          </Form>
          
          <ERC20TokenUI address={ MiniMeToken.options.address } />

      </React.Fragment>
      );
    }
  }

const mapDispatchToProps = dispatch => ({
  addToBalance(amount) {
    dispatch(accountActions.addToErc20TokenBalance(amount));
  },
});

export default connect(null, mapDispatchToProps)(TestTokenUI);
