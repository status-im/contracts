import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './dapp.css';

import EmbarkJS from 'Embark/EmbarkJS';
import IdentityFactory from 'Embark/contracts/IdentityFactory';

import ContractUI from './contract-ui.js';

__embarkContext.execWhenReady(function(){
    
    let contractUI = new ContractUI('IdentityFactory',
                                     IdentityFactory,
                                    'https://raw.githubusercontent.com/status-im/contracts/contracts-ui-demo/contracts/identity/IdentityFactory.sol');

    contractUI.buildFunctionSection($('#functions'), $('#constructor'));
    contractUI.buildSourceCodeSection($('#contract'));

    // TODO
    // 1 Use specific contract address
    // 2 Fallback / Value
});
