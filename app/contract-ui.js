class ContractUI {

    constructor(name, contract, sourceURL){
        this.instances = [];
        this.name = name;
        this.contract = contract;
        this.sourceURL = sourceURL;

        window[name] = contract;
        document.title = name + ' contract';
        $('.title').text(name)
    }
    
    buildSourceCodeSection(container){
        var Highlight = require('syntax-highlighter');
        var js = require('highlight-javascript');
        var highlight = new Highlight().use(js);

        let html = $(`<h3 class="filename"></h3>
                    <small class="url"></small>
                    <pre><code class="sourcecode" data-language="js"></code></pre>`);

        container.append(html);

        $('.filename', container).text(this.sourceURL.split('\\').pop().split('/').pop());
        $('.url', container).text(this.sourceURL);
        $.ajax({ url: this.sourceURL, success: function(data) {
            $('.sourcecode', container).text(data);
            highlight.element('.sourcecode');
        }});
        
    }


    buildFunctionSection(functionContainer, constructorContainer){
        this._loadAccounts();
        $('#getAccounts button').on('click', this._loadAccounts);

        this.contract.options.jsonInterface.forEach((elem, i) => {
            if(elem.type != "function" && elem.type != 'constructor') return;

            const isDuplicated = this.contract.options.jsonInterface.filter(x => x.name == elem.name).length > 1;
            const functionLabel = this._getFunctionLabel(elem, isDuplicated);
            const functionElem = $(`<div class="function" id="${this.name}-${i}">
                <h4>${elem.type == 'function' ? elem.name : this.name}</h4>
                <div class="scenario">
                    <div class="code">
                    await ${functionLabel}(${this._getFunctionParamFields(elem)}).${this._getMethodType(elem)}(${this.getMethodFields(elem)}) <button>&#9166;</button>
                    <img src="images/loading.gif" class="loading" alt="" />
                    </div>
                    <p class="error"></p>
                    <p class="note"></p>
                </div>
            </div>`)

            this._setButtonAction($('button', functionElem), functionLabel, elem);

            $('.loading', functionElem).hide();

            if(elem.type == 'function'){
                functionContainer.append(functionElem);
            } else {
                constructorContainer.append(functionElem);
                constructorContainer.addClass('constructor');
            }
        });


        if(this.contract.options.address != null && this.contract.options.address != undefined){
            this.instances.push(this.contract.options.address);
        }
        
        this._populateInstances();
    } 


    _populateInstances(){
        $('.constructor p.note').html('');
        $('.constructor h5').remove();
        $('.constructor p.note').before('<h5>Available instances</h5>');
        
        let instanceHtml = $('<ul></ul>');
        this.instances.forEach((elem, i) => {
            instanceHtml.append($(`<li>${elem}</li>`));
        });

        $('.constructor p.note').append(instanceHtml);
    }


    _setButtonAction(button, functionLabel, elem){
        const clkFunction = async function(){
            const parentDiv = button.parent();

            $('.loading', parentDiv).show();
            $(button).prop('disabled', true);

            const resultContainer = $('p.note', parentDiv.parents('div.scenario'))
            const errorContainer = $('p.error', parentDiv.parents('div.scenario'));

            errorContainer.text('').hide();
            
            let executionParams = {
                from: $('select.accountList', parentDiv).val(),
                gasLimit: $('input.gasLimit', parentDiv).val()
            }
    
            if(elem.payable)
                executionParams.value = $('input.value', parentDiv).val();

            let functionParams = this._getFunctionParamString(elem, parentDiv);

            let methodParams = this._getMethodString(elem);
            methodParams = methodParams.replace('$account', $('select.accountList option:selected', parentDiv).text());
            methodParams = methodParams.replace('$gasLimit', executionParams.gasLimit);
            methodParams = methodParams.replace('$value', executionParams.value);

            if(elem.type == "constructor")
                functionParams = `{arguments: [${functionParams}]}`;

            console.log(`%cawait ${functionLabel}(${functionParams}).${this._getMethodType(elem)}(${methodParams})`, 'font-weight: bold');

            const funcArguments = this._getFuncArguments(parentDiv);

            try {
                if(elem.type == 'constructor'){
                    let contractInstance = await this.contract.deploy({arguments: funcArguments}).send(executionParams);
                    this.instances.push(contractInstance.options.address);
                    this._populateInstances(); 

                    $('.loading', parentDiv).hide();
                    $(button).prop('disabled', false);
                } else {
                    resultContainer.text('');

                    const receipt = await this.contract
                                        .methods[elem.name + '(' + elem.inputs.map(input => input.type).join(',') + ')']
                                        .apply(null, funcArguments)
                                        [this._getMethodType(elem)](executionParams)
                    
                    if(this._getMethodType(elem) == 'call'){
                        resultContainer.text(receipt);
                    } else {
                        let eventList = $("<ul></ul>");
                        for(let ev in receipt.events){
                            if(!isNaN(ev)) continue;
                            const eventAbi = this.contract.options.jsonInterface.filter(x => x.name == ev)[0];
                            let props = [];
                            for(let prop in receipt.events[ev].returnValues){
                                if(isNaN(prop)){
                                    let input = eventAbi.inputs.filter(x => x.name == prop)[0];
                                    props.push(prop + ': ' 
                                                + (input.type.indexOf('int') == -1 ? '"' : '')
                                                + receipt.events[ev].returnValues[prop] 
                                                + (input.type.indexOf('int') == -1 ? '"' : ''));
                                }
                            }
                            eventList.append(`<li>${ev}(${props.join(', ')})</li>`);
                        }
                        resultContainer.append($('<b>Transaction Hash:</b> ' + receipt.transactionHash + '<br /><b>Events:</b>'));
                        resultContainer.append(eventList);
                    }
                    
                    $('.loading', parentDiv).hide();
                    $(button).prop('disabled', false);

                    console.log(receipt);
                }
            } catch (e) {
                console.error('%s: %s', e.name, e.message);
                errorContainer.text(e.name + ': ' + e.message).show();

                $('.loading', parentDiv).hide();
                $(button).prop('disabled', false);
            }
        };
        
        button.on('click', clkFunction.bind(this));
    }


    _getFuncArguments(container){
        let valueArray = [];
        $('input[data-type="inputParam"]', container).map((i, input) => {
            let v;
            if($(input).data('var-type').indexOf('[') > -1)
                v = eval($(input).val());
            else
                v = $(input).val();

            valueArray.push(v);
        });
        return valueArray;
    }


    _getFunctionLabel(elem, isDuplicated){
        if(elem.type == 'function')
            if(!isDuplicated)
                return `${this.name}.methods.${elem.name}`;
            else {
                return `${this.name}.methods['${elem.name + '(' + elem.inputs.map(input => input.type).join(',') + ')'}']`;
            }
        else
            return `${this.name}.deploy`;
    }


    _getFunctionParamFields(elem){
        return elem.inputs
                .map((input, i) => `<input type="text" data-var-type="${input.type}" data-type="inputParam" data-name="${input.name}" placeholder="${input.name}" title="${input.type} ${input.name}" size="${input.name.length}"  />`)
                .join(', ');
    }


    _getFunctionParamString(elem, container){
        return elem.inputs
                .map((input, i) => (input.type.indexOf('int') == -1 ? '"' : '') + $('input[data-name="' + input.name + '"]', container).val() + (input.type.indexOf('int') == -1 ? '"' : ''))
                .join(', ');
    }


    _getMethodType(elem){
        return (elem.constant == true || elem.stateMutability == 'view' || elem.stateMutability == 'pure') ? 'call' : 'send';
    }


    getMethodFields(elem){
        let methodParams = "({";

        methodParams += `from: <select class="accountList" disabled><option>No accounts</option></select>`;

        if(this._getMethodType(elem) == 'send'){
            methodParams += ', gasLimit: <input type="text" class="gasLimit" value="7000000" size="6" />'
            if(elem.payable){
                methodParams += ', value: <input type="text" class="value" value="0" size="6" />'
            }
        }

        return methodParams + "})"; 
    }


    _getMethodString(elem){
        let methodParams = "({";

        methodParams += `from: $account`;
        if(this._getMethodType(elem) == 'send'){
            methodParams += ', gasLimit: $gasLimit'
            if(elem.payable){
                methodParams += ', value: $value'
            }
        }
        return methodParams + "})"; 
    }


    async _loadAccounts(){
        const errorContainer = $(this).parents('div').children('p.error');

        errorContainer.hide().text('');

        try {
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
        } catch(e){
            errorContainer.text(e.name + ': ' + e.message).show();
        }
    }
}


module.exports = ContractUI;