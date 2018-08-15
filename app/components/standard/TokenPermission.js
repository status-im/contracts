import React, { Fragment, PureComponent } from 'react';
import { connect } from 'react-redux';
import web3 from "Embark/web3"
import Toggle from 'react-toggle';
import { BigNumber } from './utils'
import "react-toggle/style.css";
import CircularProgress from '@material-ui/core/CircularProgress';
import Tooltip from '@material-ui/core/Tooltip';
import FormLabel from '@material-ui/core/FormLabel';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import Switch from '@material-ui/core/Switch';
import { actions, getSNTAllowance } from '../../reducers/accounts';

// We set an allowance to be "unlimited" by setting it to
// it's maximum possible value -- namely, 2^256 - 1.
const { fromWei } = web3.utils;
const unlimitedAllowance = new BigNumber(2).pow(256).sub(1);
const getDefaultAccount = () => web3.eth.defaultAccount;
const SUPPORTED_TOKENS = ['SNT', 'STT'];
const BALANCE_KEYS = { 'SNT': 'SNTBalance', 'STT': 'SNTBalance' };

class TokenHandle extends PureComponent {
  constructor(props){
    super(props);
    this.state = {};
  }

  toggleApproved = () => {
    const { approved } = this.state;
    const { methods: { approve }, spender, receiveSntAllowance } = this.props;
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
        receiveSntAllowance(_value)
        this.setState({ ...this.state, updating: false })
      }).catch(err => {
        console.log("Approve failed: " + err);
        this.setState({ updating: false });
      })
  }

  render() {
    const { symbol, account, isLoading, mobile, SNTAllowance } = this.props;
    const { updating } = this.state;
    return (
      <Fragment>
        {!updating && !isLoading && !!account && <div>
          <FormControl component="fieldset">
            <FormLabel component="legend" style={{ textAlign: 'center' }}>Token Permissions</FormLabel>
            <FormGroup style={{ alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!Number(SNTAllowance)}
                            onChange={this.toggleApproved}
                            value={symbol}
                  />
                }
                label={`${Number(fromWei(account[BALANCE_KEYS[symbol]])).toLocaleString()} ${symbol}`}
              />
            </FormGroup>
            <FormHelperText style={{ textAlign: 'center' }}>Registry needs permission to transfer SNT from your account prior to registration</FormHelperText>
          </FormControl>
        </div>}
        {isLoading || updating && <CircularProgress style={{ marginLeft: mobile ? '45%' : null }} />}
      </Fragment>
    )
  }
}

const TokenPermissions = (props) => (
  <Fragment>
    {!props.mobile && <Fragment>
      <Tooltip title="Turn on permissions for a token to enable its use with the ENS subdomain registry">
        <h3>Token Permissions</h3>
      </Tooltip>
      <hr/>
    </Fragment>}
    <TokenHandle {...props} />
  </Fragment>
)

const mapDispatchToProps = dispatch => ({
  receiveSntAllowance(amount) {
    dispatch(actions.receiveSntAllowance(amount));
  },
});

const mapStateToProps = state => ({
  SNTAllowance: getSNTAllowance(state),
});
export default connect(mapStateToProps, mapDispatchToProps)(TokenPermissions);
