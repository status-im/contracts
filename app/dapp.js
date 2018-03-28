import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './dapp.css';

import EmbarkJS from 'Embark/EmbarkJS';
import IdentityFactory from 'Embark/contracts/IdentityFactory';

$(function(){
    $("#btnCreateIdentity").on('click', function() {
        console.log(IdentityFactory.options.address);  
        console.log("Test13");

        IdentityFactory.methods.controller().call().then((x) => console.log(x));

        web3.eth.getAccounts()
            .then(accounts => {
                console.log(accounts[0]);
                return IdentityFactory.methods.createIdentity().send({from: accounts[0]})
                
            })
            .then((tx) => console.log(tx.events));
      });
});