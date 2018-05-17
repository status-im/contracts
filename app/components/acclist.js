import EmbarkJS from 'Embark/EmbarkJS';
import React from 'react';
import { Nav, MenuItem , NavDropdown} from 'react-bootstrap';
import web3 from "Embark/web3"

class AccList extends React.Component {

    constructor(props) {
      super(props);
      this.state = {
        accounts: []
      }
      __embarkContext.execWhenReady(() => {
           this.loadAccs()   
      });
    }  

    loadAccs() {
        let result = web3.eth.getAccounts().then((accounts) => {
            console.log(accounts);
            this.setState({accounts: accounts});
        })
        console.log(result)
    }
    render(){
    var len = this.state.accounts.length;
      var fulllist = this.state.accounts.map(
        function(name, index){
            return <MenuItem eventKey={2.+index/10}>{name}</MenuItem>;
        } 
      )
      return (
        <React.Fragment>
            <Nav>
                <NavDropdown eventKey={2} title="Dropdown" id="basic-nav-dropdown">
                    {fulllist}
                    <MenuItem divider />
                    <MenuItem eventKey={2.+len/10} onClick={(e) => this.loadAccs()} >Update</MenuItem>
                </NavDropdown>
            </Nav>
        </React.Fragment>
      )
    }

  }

  export default AccList;