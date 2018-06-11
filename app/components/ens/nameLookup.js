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

const nullAddress = '0x0000000000000000000000000000000000000000'
const validAddress = address => address != nullAddress;
const formatName = domainName => domainName.includes('.') ? domainName : `${domainName}.stateofus.eth`;
const getDomain = fullDomain => formatName(fullDomain).split('.').slice(1).join('.');
const hashedDomain = domainName => hash(getDomain(domainName));

const cardStyle = {
  width: '75%',
  marginLeft: '15%',
  padding: '30px'
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
    const { domainPrice } = this.state;
    return (
      <Fragment>
        <Info.Action title="No address is associated with this domain">
          {formatName(domainName.toUpperCase())} can be registered for {domainPrice} SNT
        </Info.Action>
        <RegisterSubDomain />
        <div style={backButton} onClick={() => setStatus(null)}>&larr;</div>
      </Fragment>
    )
  }
}

class DisplayAddress extends PureComponent {
  state = { copied: false }

  render() {
    const { copied } = this.state
    const { domainName, address, statusAccount, setStatus } = this.props
    const markCopied = (v) => { this.setState({ copied: v }) }
    const isCopied = address => address == copied;
    const renderCopied = address => isCopied(address) && <span style={{ color: theme.positive }}><IconCheck/>Copied!</span>;
    return (
      <Fragment>
      {validAddress(address) ?
       <div style={{ display: 'flex', flexDirection: 'column' }}>
         <Info.Action title="Click to copy"><b>{domainName.toUpperCase()}</b> Resolves To:</Info.Action>
         {address && <Text style={{ marginTop: '1em' }}>Ethereum Address {renderCopied(address)}</Text>}
         <CopyToClipboard text={address} onCopy={markCopied}>
           <div style={addressStyle}>{address}</div>
         </CopyToClipboard>
         {statusAccount && <Text style={{ marginTop: '1em' }}>Status Address {renderCopied(statusAccount)}</Text>}
         <CopyToClipboard text={statusAccount} onCopy={markCopied}>
           <div style={{ ...addressStyle, color: isCopied ? theme.primary : null }}>{statusAccount}</div>
         </CopyToClipboard>
       </div>
:
       <Info.Action title="No address is associated with this domain">
         {domainName.toUpperCase()}
       </Info.Action>}
      <div style={backButton} onClick={() => setStatus(null)}>&larr;</div>
      </Fragment>
    )
  }
}

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
         Get Address
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
