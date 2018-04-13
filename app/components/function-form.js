import Function from './function';
 
class FunctionForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            fields: {}
        };
    }

    

    _getFunctionParamFields(elem){
        if(this.props.abi.type == 'fallback') return '';
            
        return '(' + this.props.abi.inputs
                .map((input, i) => <input type="text" data-var-type={input.type} data-type="inputParam" data-name={input.name} placeholder={input.name} title={input.type + ' ' + input.name} size={input.name.length}  />)
                .join(', ') + ')';
    }

    _getMethodType(elem){
        return (this.props.abi.constant == true || this.props.abi.stateMutability == 'view' || this.props.abi.stateMutability == 'pure') ? 'call' : 'send';
    }

    render(){
        const functionName = this.props.abi.name;
        const isDuplicated = this.props.contract.options.jsonInterface.filter(x => x.name == functionName).length > 1;
        
        return <div className="function">
            <h4>{this.props.abi.type == 'function' ? this.props.abi.name : (this.props.abi.type == 'fallback' ? '(fallback)' : this.props.abi.name)}</h4>
            <div className="scenario">
                <div className="code">
                  <Function accounts={this.props.accounts} contract={this.props.contractName} duplicated={isDuplicated} abi={this.props.abi} />
                </div>
                <p className="error"></p>
                <p className="note"></p>
            </div>
        </div>;
    }
}

export default FunctionForm;