import web3 from "Embark/web3"
import ENSSubdomainRegistry from 'Embark/contracts/ENSSubdomainRegistry';
import ENSRegistry from 'Embark/contracts/ENSRegistry';
import React from 'react';
import { Button } from 'react-bootstrap';
import { withFormik } from 'formik';
import { hash } from 'eth-ens-namehash';
import { zeroAddress, zeroBytes32 } from './utils';
import FieldGroup from '../standard/FieldGroup';

const { soliditySha3 } = web3.utils;

const InnerForm = ({
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  handleSubmit,
  isSubmitting,
  setFieldValue,
  subDomain,
  domainName,
  domainPrice,
}) => (
  <form onSubmit={handleSubmit}>
    {!subDomain && <FieldGroup
      id="subDomain"
      name="subDomain"
      type="text"
      label="Sub Domain"
      onChange={handleChange}
      onBlur={handleBlur}
      value={values.subDomain}
      error={errors.subDomain}
    />}
    {!domainName && <FieldGroup
      id="domainName"
      name="domainName"
      type="text"
      label="Domain Name"
      onChange={handleChange}
      onBlur={handleBlur}
      value={values.domainName}
      button={
        <Button
          style={{ marginTop: '5px' }}
          onClick={() => {
            ENSSubdomainRegistry.methods.getPrice(hash(values.domainName))
                                .call()
                                .then((res) => { setFieldValue('price', res); });
          }}
        >
          Get Price
        </Button>
      }
    />}
    {!domainPrice && <FieldGroup
      id="price"
      name="price"
      label="Domain Price"
      disabled
      value={values.price ? `${Number(values.price).toLocaleString()} SNT` : ''} />}
    <FieldGroup
      id="statusAddress"
      name="statusAddress"
      type="text"
      label="Status messenger address domain resolves to"
      onChange={handleChange}
      onBlur={handleBlur}
      value={values.statusAddress}
      error={errors.statusAddress}
      wide="true"
    />
    <FieldGroup
      id="address"
      name="address"
      type="text"
      label="Ethereum address domain resolves to (optional)"
      onChange={handleChange}
      onBlur={handleBlur}
      value={values.address}
      error={errors.address}
      button={<Button style={{ marginTop: '5px' }} onClick={() => setFieldValue('address', web3.eth.defaultAccount)}>Use My Primary Address</Button>}
    />
    <Button bsStyle="primary" type="submit" disabled={isSubmitting || !!Object.keys(errors).length}>{!isSubmitting ? 'Submit' : 'Submitting to the Blockchain - (this may take awhile)'}</Button>
  </form>
)

const RegisterSubDomain = withFormik({
  mapPropsToValues: props => ({ subDomain: '', domainName: '', price: '' }),
  validate(values, props) {
    const errors = {};
    const { address } = values;
    const { subDomain } = props || values;
    if (address && !web3.utils.isAddress(address)) errors.address = 'Not a valid address';
    if (!subDomain) errors.subDomain = 'Required';
    return errors;
  },
  handleSubmit(values, { setSubmitting, props }) {
    const { address, statusAddress } = values;
    const { subDomain, domainName, registeredCallbackFn } = props || values;
    const { methods: { register } } = ENSSubdomainRegistry;
    const subdomainHash = soliditySha3(subDomain);
    const domainNameHash = hash(domainName);
    const resolveToAddr = address || zeroAddress;
    const resolveToStatusAddr = statusAddress || zeroBytes32;

    const toSend = register(
      subdomainHash,
      domainNameHash,
      resolveToAddr,
      zeroBytes32,
      zeroBytes32,
      resolveToStatusAddr,
    );
    toSend.estimateGas().then(gasEstimated => {
      console.log("Register would work. :D Gas estimated: "+gasEstimated)
      console.log("Trying: register(\""+subdomainHash+"\",\""+domainNameHash+"\",\""+resolveToAddr+"\",\""+zeroBytes32+"\",\""+zeroBytes32+"\")")
      toSend.send({gas: gasEstimated+1000}).then(txId => {
        if(txId.status == "0x1" || txId.status == "0x01"){
          console.log("Register send success. :)")
        } else {
          console.log("Register send errored. :( Out of gas? ")
        }
        console.dir(txId)
      }).catch(err => {
        console.log("Register send errored. :( Out of gas?")
        console.dir(err)
      }).finally(() => {
        // REQUIRED UNTIL THIS ISSUES IS RESOLVED: https://github.com/jaredpalmer/formik/issues/597
        setTimeout(() => { registeredCallbackFn(resolveToAddr, resolveToStatusAddr); }, 200);
        setSubmitting(false);
      });
    }).catch(err => {
      console.log("Register would error. :/ Already Registered? Have Token Balance? Is Allowance set?")
      console.dir(err)
      setSubmitting(false);
    });
  }
})(InnerForm);

export default RegisterSubDomain;
