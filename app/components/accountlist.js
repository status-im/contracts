import web3 from "Embark/web3"
import EmbarkJS from 'Embark/EmbarkJS';
import React from 'react';
import { Nav, MenuItem , NavDropdown} from 'react-bootstrap';
import Blockies from 'react-blockies';

import './accountlist.css';

class AccList extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            accounts: [],
            defaultAccount: "0x0000000000000000000000000000000000000000"
        }
        __embarkContext.execWhenReady(() => {
            this.loadAccs()   
        });
    }  
    

    loadAccs() {
        let result = web3.eth.getAccounts().then((accs) => { 
            if (accs) {
                var defaultAcc = web3.eth.defaultAccount;
                this.setState({defaultAccount:  defaultAcc ? accs[0] : defaultAcc });
                this.setState({accounts: accs});
            } else {
                console.log("No accounts available.");
            }
            
        })
    }
    setDefaultAccount(index) {
        
        var defaultAcc = this.state.accounts[index];
        if(defaultAcc){
            web3.eth.defaultAccount = defaultAcc;
            this.setState({defaultAccount: defaultAcc });
        } else { 
            console.log("invalid account")
        }
    }

    render() {
        
        var accsTitle;
        var accsList = [];
        if (this.state.accounts) {
            accsTitle = this.state.defaultAccount;
            this.state.accounts.forEach(
                (name, index) => {
                    accsList.push(
                    <MenuItem key={index} onClick={(e) => this.setDefaultAccount(index) }>
                        <div className="account">
                            <div className="accountIdenticon">
                                <Blockies seed={name} />
                            </div>
                            <p className="accountHexString">
                                {name}
                            </p>
                        </div>
                    </MenuItem>);
                } 
            )
        }
        
        return (
            <React.Fragment>
                <div className="accounts"> 
                    <div className="selectedIdenticon">
                        <Blockies seed={ this.state.defaultAccount } />
                    </div>
                    <div className="accountList">
                        <Nav>
                            <NavDropdown key={1} title={accsTitle} id="basic-nav-dropdown">
                                {accsList}
                            </NavDropdown>
                        </Nav>
                    </div>
                </div>
            </React.Fragment>
        )
    }

  }

  export default AccList;