import web3 from "Embark/web3"
import ENSSubdomainRegistry from 'Embark/contracts/ENSSubdomainRegistry';
import ENSRegistry from 'Embark/contracts/ENSRegistry';
import React, { Fragment } from 'react';
import { Button, Input } from 'react-bootstrap';
import { withFormik } from 'formik';
import { hash } from 'eth-ens-namehash'
import { zeroAddress, zeroBytes32 } from './utils'
import FieldGroup from '../standard/FieldGroup'

const { soliditySha3, sha3 } = web3.utils;

const InnerForm = ({
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  handleSubmit,
  isSubmitting,
  setFieldValue
}) => (
  <form onSubmit={handleSubmit}>
    <FieldGroup
      id="subDomain"
      name="subDomain"
      type="text"
      label="Sub Domain"
      onChange={handleChange}
      onBlur={handleBlur}
      value={values.subDomain}
      error={errors.subDomain}
    />
    <FieldGroup
      id="domainName"
      name="domainName"
      type="text"
      label="Domain Name"
      onChange={handleChange}
      onBlur={handleBlur}
      value={values.domainName}
      button={
        <Button style={{ marginTop: '5px' }} onClick={() => {
            ENSSubdomainRegistry.methods.getPrice(hash(values.domainName))
                                .call()
                                .then(res => { setFieldValue('price', res); })
        }}>
          Get Price
        </Button>
      }
    />
    <FieldGroup
      id="price"
      name="price"
      label="Domain Price"
      disabled
      value={values.price ? `${Number(values.price).toLocaleString()} SNT` : ''} />
    <FieldGroup
      id="address"
      name="address"
      type="text"
      label="Address domain resolves to"
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
  validate(values) {
    const errors = {};
    const { address, subDomain } = values;
    if (address && !web3.utils.isAddress(address)) errors.address = 'Not a valid address';
    if (!subDomain) errors.subDomain = 'Required';
    return errors;
  }, 
  handleSubmit(values, { setSubmitting }) {
    const { subDomain, domainName, address } = values;
    const { methods: { register } } = ENSSubdomainRegistry;
    let subdomainHash = soliditySha3(subDomain);
    let domainNameHash = hash(domainName);
    let resolveToAddr = address || zeroAddress;
    
    let toSend = register(
      subdomainHash,
      domainNameHash,
      resolveToAddr,
      zeroBytes32,
      zeroBytes32
    );
    toSend.estimateGas({from: web3.eth.defaultAccount }).then(gasEstimated => {
      console.log("Register would work. :D Gas estimated: "+gasEstimated)
      console.log("Trying: register(\""+subdomainHash+"\",\""+domainNameHash+"\",\""+resolveToAddr+"\",\""+zeroBytes32+"\",\""+zeroBytes32+"\")")
      toSend.send({from: web3.eth.defaultAccount, gas: gasEstimated+10000}).then(txId => {
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
        setSubmitting(false);
      });
    }).catch(err => {
      console.log("Register would error. :/ Already Registered? Have Token Balance? Is Allowance set?")
      console.dir(err)
      setSubmitting(false);
    });
  }
})(InnerForm)

export default RegisterSubDomain;
