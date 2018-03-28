import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './dapp.css';

import EmbarkJS from 'Embark/EmbarkJS';
import IdentityFactory from 'Embark/contracts/IdentityFactory';
import UpdatedIdentityKernel from 'Embark/contracts/UpdatedIdentityKernel'

$(function(){
    $("#btnCreateIdentity").on('click', function(e) {
        e.preventDefault();

        console.group("Create an identity");
        console.log("IdentityFactory.methods.createIdentity().send({from: accounts[0], gasLimit: 7000000})");

        web3.eth.getAccounts()
            .then(accounts => IdentityFactory.methods.createIdentity().send({from: accounts[0], gasLimit: 7000000}))
            .then((tx) => {
                console.log(tx);
                console.log("Contract created at: %c%s", 'font-weight: bold', tx.events.IdentityCreated.returnValues.instance)
            })
            .finally(x => console.groupEnd())
       
      });

    $("#btnCreateUpdatedIdentityKernel").on('click', function(e){
        e.preventDefault();
        console.group("Create an UpdatedIdentityKernel");
        web3.eth.getAccounts() 
            .then(accounts => UpdatedIdentityKernel.deploy().send({from: accounts[0], gas: 5000000, gasPrice: 1}))
            .then(tx => console.log("Contract created at: %c%s", 'font-weight: bold', tx.options.address))
            .finally(x => console.groupEnd())
        
    })

    
});