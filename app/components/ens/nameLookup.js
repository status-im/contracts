import React, { Fragment, PureComponent } from 'react';
import { Button, Field, TextInput, Card, Info, Text } from '../../ui/components'
import { IconCheck } from '../../ui/icons'
import theme from '../../ui/theme'
import { withFormik } from 'formik';
import PublicResolver from 'Embark/contracts/PublicResolver';
import { hash } from 'eth-ens-namehash';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const nullAddress = '0x0000000000000000000000000000000000000000'
const formatName = domainName => domainName.includes('.') ? domainName : `${domainName}.stateofus.eth`;

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

class DisplayAddress extends PureComponent {
  state = { copied: false }

  render() {
    const { copied } = this.state
    const { domainName, address, statusAccount, setStatus } = this.props
    const markCopied = (v) => { this.setState({ copied: v }) }
    const validAddress = address != nullAddress;
    const isCopied = address => address == copied;
    const renderCopied = address => isCopied(address) && <span style={{ color: theme.positive }}><IconCheck/>Copied!</span>;
    return (
      <Fragment>
        {validAddress ?
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
         <Info.Action title="No address is associated with this domain">{domainName.toUpperCase()}</Info.Action>}
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
    {!status ? <form onSubmit={handleSubmit} style={{ marginTop: '3em' }}>
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
     : <DisplayAddress
         domainName={values.domainName}
         address={status.address}
         statusAccount={status.statusAccount}
         setStatus={setStatus}/>}
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
