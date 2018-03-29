import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './dapp.css';

import EmbarkJS from 'Embark/EmbarkJS';
import IdentityFactory from 'Embark/contracts/IdentityFactory';
import UpdatedIdentityKernel from 'Embark/contracts/UpdatedIdentityKernel'

__embarkContext.execWhenReady(function(){
    loadAccounts();
    $('#getAccounts button').on('click', loadAccounts);

    window.IdentityFactory = IdentityFactory;
    prepareFunctionForm(IdentityFactory, 'IdentityFactory', $('#functions'));

    var Highlight = require('syntax-highlighter');
    var js = require('highlight-javascript');
     
    var highlight = new Highlight()
     
      .use(js);
     
 
    // Loading contract code
    $('#filename').text('IdentityFactory.sol');
    $('#url').text('https://raw.githubusercontent.com/status-im/contracts/contracts-ui-demo/contracts/identity/IdentityFactory.sol');
    $.ajax({ url: 'https://raw.githubusercontent.com/status-im/contracts/contracts-ui-demo/contracts/identity/IdentityFactory.sol', success: function(data) {
         $('#sourcecode').text(data);
         highlight.element('#sourcecode');
    } });

    


    // TODO
    // 1. Add validations to fields
    // 2. Show events
    // 3. Deploy
    // 4. Use specific contract address
    // 4.5 Generalice sourcecode
    // 5. Extract to independent JS
});

















const prepareFunctionForm = function(contract, contractName, container){
    contract.options.jsonInterface.forEach((elem, i) => {
        if(elem.type != "function") return;

        let functionLabel = getFunctionLabel(contractName, elem);

        let functionParams = getFunctionParamFields(elem);

        let functionElem = $(`<div class="function" id="${contractName}-${i}">
            <h3>${elem.name}</h3>
            <div class="scenario">
                <div class="code">
                await ${functionLabel}(${functionParams}).${getMethodType(elem)}(${getMethodFields(elem)}) <button>&#9166;</button>
                </div>
                <p class="note"></p>
            </div>
        </div>`)

        setButtonAction(contract.methods[elem.name], $('button', functionElem), functionLabel, elem);

        container.append(functionElem);
    });
}

const setButtonAction = function(method, button, functionLabel, elem){
    button.on('click', async function(){
        const parentDiv = button.parent()

        const account = $('select.accountList', parentDiv).val();
        const gasLimit = $('input.gasLimit', parentDiv).val();
        const value = $('input.value', parentDiv).val();

        let functionParams = getFunctionParamString(elem, parentDiv);

        let methodParams = getMethodString(elem, '123');
        methodParams = methodParams.replace('$account', $('select.accountList option:selected', parentDiv).text());
        methodParams = methodParams.replace('$gasLimit', gasLimit);
        methodParams = methodParams.replace('$value', value);

        console.log(`%cawait ${functionLabel}(${functionParams}).${getMethodType(elem)}(${methodParams})`, 'font-weight: bold');

        let funcArguments = [];
        $.each($('input[data-type="inputParam"]', parentDiv), function(i, input){
            funcArguments.push($(input).val());
        });

        if(getMethodType(elem) == 'call'){
            let methodCall =  method.apply(null, funcArguments);
            let result = await methodCall.call({from: account});
            console.log(result);
        }
    });
}

const getFunctionLabel = function(contractName, elem){
    return `${contractName}.methods.${elem.name}`;
}

const getFunctionParamFields = function(elem){
    let htmlString = "";
    elem.inputs.forEach(function(input, i){
        if(i > 0) htmlString += ", ";
        htmlString += `<input type="text" data-type="inputParam" data-name="${input.name}" placeholder="${input.name}" title="${input.type} ${input.name}" size="${input.name.length}"  />`
    })
    return htmlString;
}

const getFunctionParamString = function(elem, container){
    let htmlString = "";
    elem.inputs.forEach(function(input, i){
        if(i > 0) htmlString += ", ";
        // TODO determine when to use quotes
        htmlString += '"' + $('input[data-name="' + input.name + '"]', container).val() + '"';
    })
    return htmlString;
}

const getMethodType = function(elem){
    return (elem.constant == true || elem.stateMutability == 'view' || elem.stateMutability == 'pure') ? 'call' : 'send';
}

const getMethodFields = function(elem){
    let methodParams = "({";

    methodParams += `from: <select class="accountList" disabled><option>No accounts</option></select>`;

    if(getMethodType(elem) == 'send'){
        methodParams += ', gasLimit: <input type="text" class="gasLimit" value="7000000" size="6" />'
        if(elem.payable){
            ', value: <input type="text" class="value" value="0" size="6" />'
        }
    }

    return methodParams + "})"; 
}

const getMethodString = function(elem, account){
    let methodParams = "({";

    methodParams += `from: $account`;
    if(getMethodType(elem) == 'send'){
        methodParams += ', gasLimit: $gasLimit'
        if(elem.payable){
            ', value: $value'
        }
    }
    return methodParams + "})"; 
}

const loadAccounts = async function(){
    let accounts = await web3.eth.getAccounts();
    window.accounts = accounts;
    let accountSelect = $('.accountList')
    $('option', accountSelect).remove();
    $.each(accounts, function(i) {
        let thisOption = '<option value="' + accounts[i] + '">account[' + i + ']</option>';
        accountSelect.append($(thisOption));
    });
    accountSelect.prop('disabled', false);

    $(this).parents('div').children('p.note').show();

    console.log("%cawait web3.eth.getAccounts()", 'font-weight: bold');
    console.log(accounts);
}