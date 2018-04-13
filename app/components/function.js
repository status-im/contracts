class Function extends React.Component {

    constructor(props) {
        super(props);
        this.state = { 
            fields: {},
            methodFields: {
                from: '',
                to: '',
                value: 0,
                data: '',
                gasLimit: '700000'
            }
        };

        this.handleParameterChange = this.handleParameterChange.bind(this);
        this.handleMethodFieldChange = this.handleMethodFieldChange.bind(this);
    }

    handleParameterChange(e){
        let newState = this.state;
        newState.fields[e.target.getAttribute('data-name')] = e.target.value;
        this.setState(newState);
    }

    handleMethodFieldChange(e){
        let newState = this.state;
        newState.methodFields[e.target.getAttribute('data-param')] = e.target.value;
        this.setState(newState);
    }

    _getFunctionLabel(){
        if(this.props.abi.type == 'function')
            if(!this.props.duplicated)
                return `${this.props.contract}.methods.${this.props.abi.name}`;
            else {
                return `${this.props.contract}.methods['${this.props.abi.name + '(' + (this.props.abi.inputs != null ? this.props.abi.inputs.map(input => input.type).join(',') : '') + ')'}']`;
            }
        else if(this.props.abi.type == 'fallback'){
            return `web3.eth.sendTransaction`;
        }
        else
            return `${this.props.contract}.deploy`;
    }

    _getMethodType(){
        return (this.props.abi.constant == true || this.props.abi.stateMutability == 'view' || this.props.abi.stateMutability == 'pure') ? 'call' : 'send';
    }

    _getMethodFields(){
        let methodParams;
        return <span>
            from: <select data-param="from" disabled={this.props.accounts.length == 0} onChange={this.handleMethodFieldChange}>
                  {
                      this.props.accounts.length == 0 ?
                        <option>No accounts</option>
                        :
                        this.props.accounts.map(function (item, i) {
                              return <option key={i} value={item}>{`account[${i}]`}</option>;
                        })
                  }
                    
                  </select>
            {
                this.props.abi.payable ?
                    <span>, value: 
                        <input type="text" data-param="value" value={this.state.methodFields.value} size="6" onChange={this.handleMethodFieldChange} />
                    </span>
                    : ''
            }
            {
                this._getMethodType() == 'send' ?
                    <span>, gasLimit: 
                        <input type="text" data-param="gasLimit" value={this.state.methodFields.gasLimit} size="6" onChange={this.handleMethodFieldChange} />
                    </span>
                    : ''
            }
            {
                this._getMethodType() == 'send' && this.props.abi.type == 'fallback' ?
                    <span>, data: 
                        <input type="text" data-param="data" value={this.state.methodFields.data} size="6" onChange={this.handleMethodFieldChange} />
                    </span>
                    : ''
            }
            </span>;
    }


    _getFunctionParamFields(){
        return <span>
                { 
                    this.props.abi.inputs
                        .map((input, i) => <input key={i} type="text" data-var-type={input.type} data-type="inputParam" data-name={input.name} placeholder={input.name} title={input.type + ' ' + input.name} size={input.name.length} value={this.state.fields[input.name]} size="6" onChange={this.handleParameterChange} />)
                        .reduce((accu, elem) => {
                            return accu === null ? [elem] : [...accu, ', ', elem]
                        }, null)
                }
                </span>;
    }

    render(){
        return <span>
            await {this._getFunctionLabel()}
            { this.props.abi.type != 'fallback' ? '(' : '' }
            { this.props.abi.type != 'fallback' ? this._getFunctionParamFields() : '' }
            { this.props.abi.type != 'fallback' ? ')' : '' }
            { this.props.abi.type != 'fallback' ? '.' + this._getMethodType() : '' }
            ({ this._getMethodFields() })
            <button>&#9166;</button>
            <img src="images/loading.gif" className="loading" alt="" />
        </span>;
    }

}

export default Function;