import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './dapp.css';

import EmbarkJS from 'Embark/EmbarkJS';
import ContractUI from './contract-ui.js';


// ===============================================
// TODO set these values
import contractObj from 'Embark/contracts/Owned';
const contractName = 'Owned';
const contractSourceCode = 'https://raw.githubusercontent.com/status-im/contracts/contracts-ui-demo/contracts/identity/IdentityFactory.sol';
alert("Before using this site. Please verify the source code to refer to the contract you wish to have an UI generated")
// ===============================================


__embarkContext.execWhenReady(function(){

    let contractUI = new ContractUI( web3,
                                    contractName,
                                    contractObj,
                                    contractSourceCode);

    contractUI.buildFunctionSection($('#functions'), $('#constructor'));
    contractUI.buildSourceCodeSection($('#contract'));
});
