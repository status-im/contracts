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
    prepareFunctionForm(IdentityFactory, 'IdentityFactory', $('#functions'), $('#constructor'));
    obtainSourceCode($('#contract'), 'https://raw.githubusercontent.com/status-im/contracts/contracts-ui-demo/contracts/identity/IdentityFactory.sol');

     
 
    


    // TODO
    // 1. Add validations to fields
    // 2 Show events
    // 3 Show on screen function result
    
    // 4 Show loading gif
    // 5 Fallback
    // 6 Use specific contract address
    // 8 Extract to independent JS
});
















const obtainSourceCode = function(container, sourceURL){
    var Highlight = require('syntax-highlighter');
    var js = require('highlight-javascript');
    var highlight = new Highlight().use(js);

    let html = $(`<h3 class="filename"></h3>
                <small class="url"></small>
                <pre><code class="sourcecode" data-language="js"></code></pre>`);

    container.append(html);

    $('.filename', container).text(sourceURL.split('\\').pop().split('/').pop());
    $('.url', container).text(sourceURL);
    $.ajax({ url: sourceURL, success: function(data) {
         $('.sourcecode', container).text(data);
         highlight.element('.sourcecode');
    }});
    
}


const prepareFunctionForm = function(contract, contractName, functionContainer, constructorContainer){
    contract.options.jsonInterface.forEach((elem, i) => {
        if(elem.type != "function" && elem.type != 'constructor') return;
        
        const isDuplicated = contract.options.jsonInterface.filter(x => x.name == elem.name).length > 0;
        const functionLabel = getFunctionLabel(contractName, elem, isDuplicated);
        const functionElem = $(`<div class="function" id="${contractName}-${i}">
            <h4>${elem.type == 'function' ? elem.name : contractName}</h4>
            <div class="scenario">
                <div class="code">
                await ${functionLabel}(${getFunctionParamFields(elem)}).${getMethodType(elem)}(${getMethodFields(elem)}) <button>&#9166;</button>
                </div>
                <p class="note"></p>
            </div>
        </div>`)

        setButtonAction(contract, $('button', functionElem), functionLabel, elem);

        if(elem.type == 'function'){
            functionContainer.append(functionElem);
        } else {
            constructorContainer.append(functionElem);
        }
    });
}


const setButtonAction = function(contract, button, functionLabel, elem){
    button.on('click', async function(){
        const parentDiv = button.parent()

        let executionParams = {
            from: $('select.accountList', parentDiv).val(),
            gasLimit: $('input.gasLimit', parentDiv).val()
        }

        if(elem.payable)
            executionParams.value = $('input.value', parentDiv).val();

        let functionParams = getFunctionParamString(elem, parentDiv);

        let methodParams = getMethodString(elem, '123');
        methodParams = methodParams.replace('$account', $('select.accountList option:selected', parentDiv).text());
        methodParams = methodParams.replace('$gasLimit', executionParams.gasLimit);
        methodParams = methodParams.replace('$value', executionParams.value);

        if(elem.type == "constructor")
            functionParams = `{arguments: [${functionParams}]}`;

        console.log(`%cawait ${functionLabel}(${functionParams}).${getMethodType(elem)}(${methodParams})`, 'font-weight: bold');

        const funcArguments = $('input[data-type="inputParam"]', parentDiv).map((i, input) => $(input).val());

        if(elem.type == 'constructor'){
            let contractInstance = await contract.deploy({arguments: funcArguments}).send(executionParams);
            console.log("Instance created: " + contractInstance.options.address);
        } else {
            const receipt = await contract
                                .methods[elem.name + '(' + elem.inputs.map(input => input.type).join(',') + ')']
                                .apply(null, funcArguments)
                                [getMethodType(elem)](executionParams)
            
            console.log(receipt);
        }
    });
}


const getFunctionLabel = function(contractName, elem, isDuplicated){
    if(elem.type == 'function')
        if(!isDuplicated)
            return `${contractName}.methods.${elem.name}`;
        else {
            return `${contractName}.methods['${elem.name + '(' + elem.inputs.map(input => input.type).join(',') + ')'}']`;
        }
    else
        return `${contractName}.deploy`;
}


const getFunctionParamFields = function(elem){
    return elem.inputs
            .map((input, i) => `<input type="text" data-type="inputParam" data-name="${input.name}" placeholder="${input.name}" title="${input.type} ${input.name}" size="${input.name.length}"  />`)
            .join(', ');
}


const getFunctionParamString = function(elem, container){
    return elem.inputs
            .map((input, i) => '"' + $('input[data-name="' + input.name + '"]', container).val() + '"')
            .join(', ');
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
            methodParams += ', value: <input type="text" class="value" value="0" size="6" />'
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
            methodParams += ', value: $value'
        }
    }
    return methodParams + "})"; 
}


const loadAccounts = async function(){
    let accounts = await web3.eth.getAccounts();
    window.accounts = accounts;
    let accountSelect = $('.accountList')
    $('option', accountSelect).remove();
    
    accounts.map((account, i) => `<option value="${account}">accounts[${i}]</option>`)
            .forEach(elem => accountSelect.append($(elem)));

    accountSelect.prop('disabled', false);

    $(this).parents('div').children('p.note').show();

    console.log("%cawait web3.eth.getAccounts()", 'font-weight: bold');
    console.log(accounts);
}