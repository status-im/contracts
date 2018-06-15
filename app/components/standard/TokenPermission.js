import React, { Fragment, PureComponent } from 'react';
import { Tooltip, OverlayTrigger } from 'react-bootstrap';
import web3 from "Embark/web3"
import Toggle from 'react-toggle';
import { BigNumber } from './utils'
import "react-toggle/style.css";
import CircularProgress from '@material-ui/core/CircularProgress';

// We set an allowance to be "unlimited" by setting it to
// it's maximum possible value -- namely, 2^256 - 1.
const unlimitedAllowance = new BigNumber(2).pow(256).sub(1);
const getDefaultAccount = () => web3.eth.defaultAccount;
const SUPPORTED_TOKENS = ['SNT'];
const BALANCE_KEYS = { 'SNT': 'SNTBalance' };

class TokenHandle extends PureComponent {
  constructor(props){
    super(props);
    this.state = { approved: 0 };
  }

  componentDidMount() {
    __embarkContext.execWhenReady(() => {
      this.getAllowance();
    });
  }

  getAllowance = () => {
    const { methods, spender } = this.props;
    methods.allowance(getDefaultAccount(), spender)
           .call()
           .then(approved => {
             this.setState({ ...this.state, approved })
           })
  }

  toggleApproved = () => {
    const { approved } = this.state;
    const { methods: { approve }, spender } = this.props;
    const isApproved = !!Number(approved);
    let amountToApprove = isApproved ? 0 : unlimitedAllowance;
    console.log("approve(\""+spender+"\",\"" +amountToApprove +"\")")
    this.setState({ updating: true });
    approve(
      spender,
      amountToApprove
    )
           .send()
           .then(approval => {
             const { events: { Approval: { returnValues: { _value } } } } = approval
             this.setState({ ...this.state, approved: _value, updating: false })
           }).catch(err => {
             console.log("Approve failed: " + err);
             this.setState({ updating: false });
           })
  }

  render() {
    const { symbol, account, isLoading } = this.props;
    const { approved, updating } = this.state;
    return (
      <Fragment>
      {!updating && !isLoading && !!account && <div style={{ display: 'flex', justifyContent: 'center', margin: '10px', paddingLeft: '60px' }}>
        <Toggle
          checked={!!Number(approved)}
          name={symbol}
          onChange={this.toggleApproved} />
        <label style={{ margin: '2px 0px 0px 10px', fontWeight: 400 }}>{`${Number(account[BALANCE_KEYS[symbol]]).toLocaleString()} ${symbol.toUpperCase()}`}</label>
      </div>}
      {isLoading || updating && <CircularProgress />}
      </Fragment>
    )
  }
}

const tooltip = (
  <Tooltip id="tooltip">
    Turn on permissions for a token to enable its use with the ENS subdomain registry.
  </Tooltip>
);

const TokenPermissions = (props) => (
  <Fragment>
    <OverlayTrigger placement="right" overlay={tooltip}>
      <h3>Token Permissions</h3>
    </OverlayTrigger>
    <hr/>
    <TokenHandle {...props} />
  </Fragment>
)

export default TokenPermissions;
