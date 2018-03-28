import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import EmbarkJS from 'Embark/EmbarkJS';
import IdentityFactory from 'Embark/contracts/IdentityFactory';

import './dapp.css';


$(function(){
     
    $("#btnCreateIdentity").on('click', async function() {
        console.log(IdentityFactory.options.address);  
        console.log("Test3");
        web3.eth.getAccounts()
        .then(accounts => console.log(accounts))
            //.then(accounts => IdentityFactory.methods.createIdentity().send({from: accounts[0], gasLimit: 5000000}))
           // .then((tx) => console.log(tx.events));
     
        // test
        //  addToLog("#blockchain", "SimpleStorage.methods.set(value).send({from: web3.eth.defaultAccount})");
      });




});