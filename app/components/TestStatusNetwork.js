import EmbarkJS from 'Embark/EmbarkJS';
import StatusRoot from 'Embark/contracts/StatusRoot';
import MiniMeToken from 'Embark/contracts/MiniMeToken';
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
    
    async mint(e){
      e.preventDefault();
      await EmbarkJS.enableEthereum();
      var value = parseInt(this.state.amountToMint, 10);
      StatusRoot.methods.mint(value).send({ gas: 1000000 })

      console.log(StatusRoot.options.address +".mint("+value+").send({from: " + web3.eth.defaultAccount + "})");
    }
    
    render(){
      return (<React.Fragment>
          <h3> Test Status Network</h3>
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

export default TestTokenUI;
