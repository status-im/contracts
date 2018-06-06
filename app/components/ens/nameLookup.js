import React, { Fragment, PureComponent } from 'react';
import { Button, Field, TextInput, Card, Info, Text } from '../../ui/components'
import theme from '../../ui/theme'
import { withFormik } from 'formik';
import PublicResolver from 'Embark/contracts/PublicResolver';
import { hash } from 'eth-ens-namehash';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const nullAddress = '0x0000000000000000000000000000000000000000'
const formatName = domainName => domainName.includes('.') ? domainName : `${domainName}.stateofus.eth`;

const copiedText = {
  color: 'white',
  textAlign: 'center'
}
const cardStyle = {
  width: '75%',
  marginLeft: '15%',
  padding: '30px'
}

const addressStyle = {
  fontSize: '18px',
  fontWeight: 400,
  margin: '3% 0 3% 0',
  cursor: 'copy'
}

const backButton = {
  fontSize: '40px',
  color: theme.accent
}

class DisplayAddress extends PureComponent {
  state = { copied: false }

  render() {
    const { copied } = this.state
    const { domainName, address, setStatus } = this.props
    const markCopied = () => { this.setState({ copied: !copied }) }
    const validAddress = address != nullAddress;
    return (
      <Fragment>
        {validAddress ?
         <div>
           <Info.Action title="Click to copy"><b>{domainName.toUpperCase()}</b> Resolves To:</Info.Action>
           <CopyToClipboard text={address} onCopy={markCopied}>
             <div style={addressStyle}>{address}</div>
           </CopyToClipboard>
           {copied &&
            <Info background={theme.positive} style={copiedText}>
              <span>COPIED</span>
            </Info>}
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
    {!status ? <form onSubmit={handleSubmit}>
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
     : <DisplayAddress domainName={values.domainName} address={status} setStatus={setStatus}/>}
  </Card>
)

const NameLookup = withFormik({
  mapPropsToValues: props => ({ domainName: '' }),
  handleSubmit(values, { setSubmitting, setStatus }) {
    const { domainName } = values;
    PublicResolver.methods.addr(hash(formatName(domainName)))
                  .call()
                  .then(res =>{
                    setStatus(res)
                  });
  }
})(InnerForm)

export default NameLookup;
