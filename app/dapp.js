import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './dapp.css';

import EmbarkJS from 'Embark/EmbarkJS';
import Identity from 'Embark/contracts/Identity';

import ContractUI from './contract-ui.js';

__embarkContext.execWhenReady(function(){
    
    let contractUI = new ContractUI( web3,
                                    'Identity',
                                     Identity,
                                    'https://raw.githubusercontent.com/status-im/contracts/contracts-ui-demo/contracts/identity/IdentityFactory.sol');

    contractUI.buildFunctionSection($('#functions'), $('#constructor'));
    contractUI.buildSourceCodeSection($('#contract'));
});
