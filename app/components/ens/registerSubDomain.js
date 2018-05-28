import web3 from "Embark/web3"
import ENSSubdomainRegistry from 'Embark/contracts/ENSSubdomainRegistry';
import ENSRegistry from 'Embark/contracts/ENSRegistry';
import React, { Fragment } from 'react';
import { Button } from 'react-bootstrap';
import { withFormik } from 'formik';
import { hash } from 'eth-ens-namehash'
import { zeroAddress, zeroBytes32 } from './utils'
import FieldGroup from '../standard/FieldGroup'

const InnerForm = ({
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  handleSubmit,
  isSubmitting,
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
    />
    <FieldGroup
      id="address"
      name="address"
      type="text"
      label="Address domain resolves to"
      onChange={handleChange}
      onBlur={handleBlur}
      value={values.address}
      error={errors.address}
    />
    <Button bsStyle="primary" type="submit" disabled={isSubmitting || !!Object.keys(errors).length}>{!isSubmitting ? 'Submit' : 'Submitting to the Blockchain - (this may take awhile)'}</Button>
  </form>
)

const RegisterSubDomain = withFormik({
  mapPropsToValues: props => ({ subDomain: '', domainName: '' }),
  validate(values) {
    const errors = {};
    const { address } = values;
    if (address && !web3.utils.isAddress(address)) errors.address = 'Not a valid address'
    return errors;
  },
  handleSubmit(values, { setSubmitting }) {
    const { subDomain, domainName, address } = values;
    const { soliditySha3 } = web3.utils;
    const { methods: { register } } = ENSSubdomainRegistry;
    register(
      soliditySha3(subDomain),
      hash(domainName),
      address || zeroAddress,
      zeroBytes32,
      zeroBytes32
    )
      .send()
      .then(res => {
        setSubmitting(false);
        console.log(res)
      });
  }
})(InnerForm)

export default RegisterSubDomain;
