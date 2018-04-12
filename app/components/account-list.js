class AccountList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: false,
            errorMessage: ""
        };

        this.handleClick = this.handleClick.bind(this);
    }

    async handleClick(e){
        e.preventDefault();

        try {
            let accounts = await web3.eth.getAccounts();
            window.accounts = accounts;

            console.log("%cawait web3.eth.getAccounts()", 'font-weight: bold');
            console.log(accounts);
        
            this.props.accountUpdate(accounts);
        } catch(err) {
            this.setState({
                error: true,
                errorMessage: e.name + ': ' + e.message
            })
        }

    }

    render(){
        return <div>
            <h3>Get Accounts</h3>
            <div className="scenario">
            <div id="getAccounts" className="code">
                await web3.eth.getAccounts(); <button onClick={this.handleClick}>&#9166;</button>
            </div>
            <p className="note"><tt>accounts</tt> variable is available in the console</p>
            {this.state.error ? '<p className="error">' + this.state.errorMessage + '</p>' : ''}
            </div>
        </div>;
    }
}

export default AccountList;
