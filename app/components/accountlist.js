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
            classNameNavDropdown: props.classNameNavDropdown,
            defaultAccount: "0x0000000000000000000000000000000000000000",
            addresses: [],
            balances: []
        }
        __embarkContext.execWhenReady(() => {
            this.load()   
        });
    }  
    

    load() {
        web3.eth.getAccounts((err, addresses) => { 
            if (addresses) {
                var defaultAccount = web3.eth.defaultAccount;
                if(!defaultAccount){
                    web3.eth.defaultAccount = addresses[0];
                }
                
                var balances = [];
                balances.length == addresses.length;
                addresses.forEach((address, index) => {
                    web3.eth.getBalance(address, 'latest', (err, balance) => {
                        balances[index] = balance;
                        if(index+1 == balances.length){
                            this.setState({
                                balances: balances
                            });
                        }
                    })
                })
                this.setState({
                    defaultAccount: defaultAccount,
                    addresses: addresses
                });
                
            } else {
                console.log("No addresses available.");
            }
            
        })
    }
    setDefaultAccount(index) {
        var defaultAcc = this.state.addresses[index];
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
        if (this.state.addresses) {
            accsTitle = this.state.defaultAccount;
            this.state.addresses.forEach(
                (name, index) => {
                    accsList.push(
                    <MenuItem key={index} onClick={(e) => this.setDefaultAccount(index) }>
                        <div className="account">
                            <div className="accountIdenticon">
                                <Blockies seed={name} />
                            </div>
                            <div className="accountHexString">
                                {name}
                            </div>
                            <div className="accountBalance">
                                 Ξ {this.state.balances[index] / (10**18)}
                            </div>
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
                            <NavDropdown key={1} title={accsTitle} id="basic-nav-dropdown" className={ this.state.classNameNavDropdown }>
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