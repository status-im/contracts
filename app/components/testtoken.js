import EmbarkJS from 'Embark/EmbarkJS';
import TestToken from 'Embark/contracts/TestToken';
import React from 'react';
import { Form, FormGroup, FormControl, HelpBlock, Button } from 'react-bootstrap';
import ERC20TokenUI from './erc20token';

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
      e.preventDefault();
  
      var value = parseInt(this.state.amountToMint, 10);
  
      if (EmbarkJS.isNewWeb3()) {
        TestToken.methods.mint(value).send({from: web3.eth.defaultAccount});
      } else {
        TestToken.mint(value);
      }
      console.log(TestToken.options.address +".mint("+value+").send({from: " + web3.eth.defaultAccount + "})");
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
          
          <ERC20TokenUI address={ TestToken.options.address } />

      </React.Fragment>
      );
    }
  }

  export default TestTokenUI;