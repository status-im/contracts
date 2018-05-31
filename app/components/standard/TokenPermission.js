import React, { Fragment, PureComponent } from 'react';
import { Tooltip, OverlayTrigger } from 'react-bootstrap';
import web3 from "Embark/web3"
import Toggle from 'react-toggle';
import { BigNumber } from './utils'
import "react-toggle/style.css";

// We set an allowance to be "unlimited" by setting it to
// it's maximum possible value -- namely, 2^256 - 1.
const unlimitedAllowance = new BigNumber(2).pow(256).sub(1);
const getDefaultAccount = () => web3.eth.defaultAccount;
const SUPPORTED_TOKENS = ['SNT'];

class TokenHandle extends PureComponent {
  constructor(props){
    super(props);
    this.state = { balance: 0, approved: 0 };
  }

  componentDidMount() {
    setTimeout(() => {
      this.getBalance();
      this.getAllowance();
    }, 1000)
  }

  getBalance = () => {
    this.props.methods.balanceOf(getDefaultAccount())
           .call()
           .then(balance => { this.setState({ ...this.state, balance }) });
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
      approve(
        spender,
        amountToApprove
      )
        .send()
        .then(approval => {
          const { events: { Approval: { returnValues: { _value } } } } = approval
          this.setState({ ...this.state, approved: _value })
        }).catch(err => {
          console.log("Approve failed: " + err);
        })
  }

  render() {
    const { symbol } = this.props;
    const { balance, approved } = this.state;
    return (
      <div style={{ display: 'flex' }}>
        <Toggle
          checked={!!Number(approved)}
          name={symbol}
          onChange={this.toggleApproved} />
        <label style={{ margin: '2px 0px 0px 10px', fontWeight: 400 }}>{`${Number(balance).toLocaleString()} ${symbol.toUpperCase()}`}</label>
      </div>
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
