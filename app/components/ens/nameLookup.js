import React, { Fragment, PureComponent } from 'react';
import ENSSubdomainRegistry from 'Embark/contracts/ENSSubdomainRegistry';
import { Button, Field, TextInput, Card, Info, Text } from '../../ui/components'
import { IconCheck } from '../../ui/icons'
import theme from '../../ui/theme'
import { withFormik } from 'formik';
import PublicResolver from 'Embark/contracts/PublicResolver';
import { hash } from 'eth-ens-namehash';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import RegisterSubDomain from '../ens/registerSubDomain';
const { getPrice } = ENSSubdomainRegistry.methods;

const invalidSuffix = '0000000000000000000000000000000000000000'
const nullAddress = '0x0000000000000000000000000000000000000000'
const validAddress = address => address != nullAddress;
const validStatusAddress = address => !address.includes(invalidSuffix);
const formatName = domainName => domainName.includes('.') ? domainName : `${domainName}.stateofus.eth`;
const getDomain = fullDomain => formatName(fullDomain).split('.').slice(1).join('.');
const hashedDomain = domainName => hash(getDomain(domainName));

const cardStyle = {
  width: '75%',
  marginLeft: '15%',
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

class RenderAddresses extends PureComponent {
  state = { copied: false }

  render() {
    const { domainName, address, statusAccount } = this.props
    const { copied } = this.state
    const markCopied = (v) => { this.setState({ copied: v }) }
    const isCopied = address => address == copied;
    const renderCopied = address => isCopied(address) && <span style={{ color: theme.positive }}><IconCheck/>Copied!</span>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Info.Action title="Click to copy"><b>{formatName(domainName).toUpperCase()}</b> Resolves To:</Info.Action>
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
             <span style={{ color: theme.accent }}>{formattedDomain.toUpperCase()}</span> can be registered for {domainPrice} SNT
           </Info.Action>
           <RegisterSubDomain
             subDomain={formattedDomainArray[0]}
             domainName={formattedDomainArray.slice(1).join('.')}
             domainPrice={domainPrice}
             registeredCallbackFn={(address, statusAccount) => this.setState({ registered: { address, statusAccount } })} />
         </Fragment> :
         <RenderAddresses {...this.props} address={registered.address} statusAccount={registered.statusAccount} />}
        <div style={backButton} onClick={() => setStatus(null)}>&larr;</div>
      </Fragment>
    )
  }
}

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
  <Card style={cardStyle}>
    {!status
     ? <form onSubmit={handleSubmit} style={{ marginTop: '3em' }}>
       <Field label="Enter Domain or Status Name" wide>
         <TextInput
           value={values.domainName}
           name="domainName"
           onChange={handleChange}
           wide
           required />
       </Field>
       <Button mode="strong" type="submit" wide>
         Lookup Address
       </Button>
     </form>
     : validAddress(status.address) ?
     <DisplayAddress
       domainName={values.domainName}
       address={status.address}
       statusAccount={status.statusAccount}
       setStatus={setStatus} /> :
     <Register
       setStatus={setStatus}
       domainName={values.domainName}  />
    }
  </Card>
)

const NameLookup = withFormik({
  mapPropsToValues: props => ({ domainName: '' }),
  async handleSubmit(values, { status, setSubmitting, setStatus }) {
    const { domainName } = values;
    const { addr, text } = PublicResolver.methods;
    const lookupHash = hash(formatName(domainName));
    const address = await addr(lookupHash).call();
    const statusAccount = await text(lookupHash, 'statusAccount').call();
    setStatus({ address, statusAccount });
  }
})(InnerForm)

export default NameLookup;
