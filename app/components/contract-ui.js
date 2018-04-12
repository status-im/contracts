import Tab from './tab'; 
import AccountList from './account-list';
import SourceArea from './source-area';
import InstanceSelector from './instance-selector';

class ContractUI extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            accounts: [],
            instances: [],
            selectedInstance: null
        };

        if(props.contract.options.address != null){
            this.state.instances = [props.contract.options.address];
            this.state.selectedInstance = props.contract.options.address;
        }

        this.handleAccountUpdate = this.handleAccountUpdate.bind(this);
        this.handleInstanceSelection = this.handleInstanceSelection.bind(this);
    }

    handleAccountUpdate(_accounts){
        this.setState({
            accounts: _accounts
        });
    }

    handleInstanceSelection(_instance){
        this.props.contract.options.address = _instance;
        this.setState({
            selectedInstance: _instance
        })
    }

    render() {
        return <div>
            <h1><span>{this.props.name}</span> <small>contract</small></h1>
            <p>Open your browser's console: <code>Tools &gt; Developer Tools</code></p>
            <p>Remix: <a href="https://remix.ethereum.org">http://remix.ethereum.org</a></p>
            <ul className="nav nav-tabs" role="tablist" id="myTabs">
                <li role="presentation" className="active"><a href="#deploy" role="tab" data-toggle="tab">Instance</a></li>
                <li role="presentation"><a href="#functions" role="tab" data-toggle="tab">Functions</a></li>
                <li role="presentation"><a href="#contract" role="tab" data-toggle="tab">Contract</a></li>
            </ul>
            <div className="tab-content">
                <Tab id="deploy" name="Deployment / Utils" active={true}>
                    <AccountList accountUpdate={this.handleAccountUpdate} />
                    <h3>Deploy</h3>
                    <div id="constructor">
                    </div>   
                </Tab>
                <Tab id="functions" name="Functions">
                    <InstanceSelector selectedInstance={this.state.selectedInstance} instances={this.state.instances} instanceUpdate={this.handleInstanceSelection} />
                </Tab>
                <Tab id="contract" name="Contract">
                    <SourceArea sourceURL={this.props.sourceURL} />
                </Tab>
            </div>
        </div>;
    }
}

export default ContractUI;