import React, { Fragment, PureComponent } from 'react';
import web3 from 'web3';
import { connect } from 'react-redux';
import { actions as accountActions } from '../../reducers/accounts';
import Hidden from '@material-ui/core/Hidden';
import ENSSubdomainRegistry from 'Embark/contracts/ENSSubdomainRegistry';
import { Button, Field, TextInput, MobileSearch, Card, Info, Text } from '../../ui/components'
import { IconCheck } from '../../ui/icons'
import theme from '../../ui/theme'
import { withFormik } from 'formik';
import PublicResolver from 'Embark/contracts/PublicResolver';
import { hash } from 'eth-ens-namehash';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import RegisterSubDomain from '../ens/registerSubDomain';
import StatusLogo from '../../ui/icons/components/StatusLogo'
import EnsLogo from '../../ui/icons/logos/ens.png';
import { formatPrice } from '../ens/utils'
const { getPrice, getExpirationTime } = ENSSubdomainRegistry.methods;

const invalidSuffix = '0000000000000000000000000000000000000000'
const nullAddress = '0x0000000000000000000000000000000000000000'
const validAddress = address => address != nullAddress;
const validStatusAddress = address => !address.includes(invalidSuffix);
const formatName = domainName => domainName.includes('.') ? domainName : `${domainName}.stateofus.eth`;
const getDomain = fullDomain => formatName(fullDomain).split('.').slice(1).join('.');
const hashedDomain = domainName => hash(getDomain(domainName));
const { fromWei } = web3.utils;

const cardStyle = {
  width: '100%',
  padding: '30px',
  height: '425px'
}

const addressStyle = {
  fontSize: '18px',
  fontWeight: 400,
  cursor: 'copy',
  wordWrap: 'break-word',
}

const backButton = {
  fontSize: '40px',
  color: theme.accent,
  cursor: 'pointer'
}

const generatePrettyDate = (timestamp) => new Date(timestamp * 1000).toDateString();

class RenderAddresses extends PureComponent {
  state = { copied: false }

  render() {
    const { domainName, address, statusAccount, expirationTime } = this.props
    const { copied } = this.state
    const markCopied = (v) => { this.setState({ copied: v }) }
    const isCopied = address => address == copied;
    const renderCopied = address => isCopied(address) && <span style={{ color: theme.positive }}><IconCheck/>Copied!</span>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Info.Action title="Click to copy"><b>{formatName(domainName).toUpperCase()}</b>{expirationTime && <i> (Expires {generatePrettyDate(expirationTime)})</i>} Resolves To:</Info.Action>
        {address && <Text style={{ marginTop: '1em' }}>Ethereum Address {renderCopied(address)}</Text>}
        <CopyToClipboard text={address} onCopy={markCopied}>
          <div style={addressStyle}>{address}</div>
        </CopyToClipboard>
        {validStatusAddress(statusAccount) && <Text style={{ marginTop: '1em' }}>Status Address {renderCopied(statusAccount)}</Text>}
        {validStatusAddress(statusAccount) && <CopyToClipboard text={statusAccount} onCopy={markCopied}>
          <div style={{ ...addressStyle, color: isCopied ? theme.primary : null }}>{statusAccount}</div>
        </CopyToClipboard>}
      </div>
    )
  }
}

class Register extends PureComponent {
  state = { domainPrice: null };

  componentDidMount() {
    const { domainName } = this.props;
    getPrice(hashedDomain(domainName))
      .call()
      .then((res) => { this.setState({ domainPrice: res })});
  }

  onRegistered = (address, statusAccount) => {
    const { domainPrice } = this.state;
    const { subtractFromBalance } = this.props;
    subtractFromBalance(domainPrice);
    this.setState({ registered: { address, statusAccount } });
  }

  render() {
    const { domainName, setStatus } = this.props;
    const { domainPrice, registered } = this.state;
    const formattedDomain = formatName(domainName);
    const formattedDomainArray = formattedDomain.split('.')
    return (
      <Fragment>
        {!registered ?
         <Fragment>
           <Info.Action title="No address is associated with this domain">
             <span style={{ color: theme.accent }}>{formattedDomain.toUpperCase()}</span> can be registered for {!!domainPrice && formatPrice(fromWei(domainPrice))} SNT
           </Info.Action>
           <RegisterSubDomain
             subDomain={formattedDomainArray[0]}
             domainName={formattedDomainArray.slice(1).join('.')}
             domainPrice={domainPrice}
             registeredCallbackFn={this.onRegistered} />
         </Fragment> :
         <RenderAddresses {...this.props} address={registered.address} statusAccount={registered.statusAccount} />}
        <div style={backButton} onClick={() => setStatus(null)}>&larr;</div>
      </Fragment>
    )
  }
}

const mapDispatchToProps = dispatch => ({
  subtractFromBalance(amount) {
    dispatch(accountActions.subtractfromSntTokenBalance(amount));
  },
});

const ConnectedRegister = connect(null, mapDispatchToProps)(Register);

const DisplayAddress = (props) => (
  <Fragment>
    {validAddress(props.address) ?
     <RenderAddresses {...props} />
     :
     <Info.Action title="No address is associated with this domain">
       {props.domainName.toUpperCase()}
     </Info.Action>}
    <div style={backButton} onClick={() => props.setStatus(null)}>&larr;</div>
  </Fragment>
)

const LookupForm = ({ handleSubmit, values, handleChange }) => (
  <Fragment>
    <form onSubmit={handleSubmit} style={{ marginTop: '3em' }}>
      <Field label="Enter Domain or Status Name" wide>
        <TextInput
          value={values.domainName}
          name="domainName"
          onChange={handleChange}
          wide
          required />
      </Field>
      <MobileSearch style={{ marginBottom: '10px' }} wide />
      <Button mode="strong" type="submit" wide>
        Lookup Address
      </Button>
    </form>
  </Fragment>
)

const InnerForm = ({
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  handleSubmit,
  isSubmitting,
  status,
  setStatus
}) => (
  <div style={{ margin: '10px' }}>
    <Hidden smDown>
    <span style={{ display: 'flex', justifyContent: 'space-evenly', marginBottom: '10px' }}>
      <StatusLogo />
      <img  style={{ maxWidth: '150px', alignSelf: 'center' }} src={EnsLogo} alt="Ens Logo"/>
    </span>
    </Hidden>
    {!status
     ? <LookupForm {...{ handleSubmit, values, handleChange }} />
     : validAddress(status.address) ?
     <DisplayAddress
       domainName={values.domainName}
       address={status.address}
       statusAccount={status.statusAccount}
       expirationTime={status.expirationTime}
       setStatus={setStatus} /> :
     <ConnectedRegister
       setStatus={setStatus}
       domainName={values.domainName}  />
    }
  </div>
)

const NameLookup = withFormik({
  mapPropsToValues: props => ({ domainName: '' }),
  async handleSubmit(values, { status, setSubmitting, setStatus }) {
    const { domainName } = values;
    const { addr, text } = PublicResolver.methods;
    const lookupHash = hash(formatName(domainName));
    const address = await addr(lookupHash).call();
    const statusAccount = await text(lookupHash, 'statusAccount').call();
    const expirationTime = await getExpirationTime(lookupHash).call();
    setStatus({ address, statusAccount, expirationTime });
  }
})(InnerForm)

export default NameLookup;
