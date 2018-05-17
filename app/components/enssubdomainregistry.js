import EmbarkJS from 'Embark/EmbarkJS';
import ENSSubdomainRegistry from 'Embark/contracts/ENSSubdomainRegistry';
import React from 'react';
import { Form, FormGroup, FormControl, HelpBlock, Button } from 'react-bootstrap';
 
class ENSSubdomainRegistryUI extends React.Component {

    constructor(props) {
      super(props);
      this.state = {
        username : "",
        address: "",
        pubkey: "",
        logs: []
      }      
    }  

    update_username(e){
      this.setState({username: e.target.value});
      //lookup ens
      //- if not found enable register and lookup price
      //  ENSSubdomainRegistry.methods.getPrice(domains.paid.namehash).call()
      //  and enable register button
      //
      //- if found, try to resolve address and pubkey
      //
      //- lookup subdomain owner and if subdomain owner is defaultAccount 
      //  enable edit of address/pubkey and other buttons (except release domain and update funds owner)
      //
      //- if ENSSubdomainRegistry.methods.getCreationDate(subdomainNameHash) + 
      //  ENSSubdomainRegistry.methods.releaseDelay().call(); 
      //  is less then current timestamp enable "release domain" button 
      //
      //- if ens.owner(subdomain) is not equal to ENSSubdomainRegistry.getFundsOwner(subdomain)
      //  and  default account is ens.owner(subdomain), enable update funds owner
      //
      //- if ens.owner(domain) is not equal ENSubdomainRegistry.address
      //  and default account is ens.owner(subdomain), enable move subdomain
    }

    update_address(e){
      this.setState({address: e.target.value});
    }

    update_pubkey(e){
      this.setState({pubkey: e.target.value});
    }
    
    register() {
      /*let result = await ENSSubdomainRegistry.methods.register(
        labelHash, 
        domains.paid.namehash,
        utils.zeroAddress,
        utils.zeroBytes32,
        utils.zeroBytes32
    ).send({from: registrant});
     */
    }

    updateResolver() {
      //should call PublicResolver.methods.setAddr(address) 
      //        +  PublicResolver.methods.setPubKey(bytes32,bytes32)
    }
    
    updateFundsOwner() {
      /*ENSSubdomainRegistry.methods.updateFundsOwner(
            labelHash,
            domains.paid.namehash
        ).send({from: newOwner});*/
    }
    
    moveSubdomain () {
      //ENSSubdomainRegistry.methods.moveAccount(labelHash, domainHash)
    }
    
    releaseSubdomain() {
      /**
       * ENSSubdomainRegistry.methods.release(
            web3Utils.sha3(subdomain), 
            domains.free.namehash
        ).send({from: registrant});
       */
    } 

    _addToLog(txt){
      this.state.logs.push(txt);
      this.setState({logs: this.state.logs});
    }
  
    render(){
      return (<React.Fragment>
     
          <h2> Subdomain management</h2>
          <Form inline>
            <FormGroup>
            <FormControl
                  type="text"
                  onChange={(e) => this.update_username(e)} />
              <FormControl
                  type="text"
                  onChange={(e) => this.update_address(e)} />
              <FormControl
                  type="text"
                  onChange={(e) => this.update_pubkey(e) } />
              
            <Button bsStyle="primary" onClick={(e) => this.register(e)}>Register Subdomain</Button>
            <Button bsStyle="primary" onClick={(e) => this.updateResolver(e)}>Update Resolver</Button>
            <Button bsStyle="primary" onClick={(e) => this.updateFundsOwner(e)}>Update Funds Owner</Button>
            <Button bsStyle="primary" onClick={(e) => this.moveSubdomain(e)}>Update Account</Button>
            <Button bsStyle="primary" onClick={(e) => this.releaseSubdomain(e)}>Release Subdomain</Button>
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

  export default ENSSubdomainRegistryUI;