import FunctionForm from './function-form';
 
class FunctionArea extends React.Component {
    constructor(props) {
        super(props);
        this.state = { };
    }

    render(){   
        const type = this.props.type;
        const contract = this.props.contract;
        const contractName = this.props.contractName;
        const accounts = this.props.accounts;
        
        return <div>
            {
                this.props.contract.options.jsonInterface
                    .filter(item => item.type == type)
                    .map((item, i) => <FunctionForm key={i} accounts={accounts} contract={contract} contractName={contractName} abi={item} />)
            }
        </div>;
    }
}

export default FunctionArea;