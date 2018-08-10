import ENSSubdomainRegistry from 'Embark/contracts/ENSSubdomainRegistry';
import web3 from 'web3';
import React from 'react';
import { hash } from 'eth-ens-namehash';
import { Button } from 'react-bootstrap';
import FieldGroup from '../standard/FieldGroup';
import { withFormik } from 'formik';

const InnerForm = ({
  values,
  errors,
  handleChange,
  handleBlur,
  handleSubmit,
  isSubmitting,
}) => (
  <form onSubmit={handleSubmit}>
    <FieldGroup
      id="newAddress"
      name="newAddress"
      type="text"
      label="New Controller Address"
      onChange={handleChange}
      onBlur={handleBlur}
      value={values.newAddress}
      error={errors.newAddress}
    />
    <FieldGroup
      id="domainName"
      name="domainName"
      type="text"
      label="Domain Name"
      onChange={handleChange}
      onBlur={handleBlur}
      value={values.domainName}
      error={errors.domainName}
    />
    <Button bsStyle="primary" type="submit" disabled={isSubmitting || !!Object.keys(errors).length}>{!isSubmitting ? 'Submit' : 'Submitting to the Blockchain - (this may take awhile)'}</Button>
  </form>
)

const MoveDomain = withFormik({
  mapPropsToValues: props => ({ newAddress: '' }),
  async validate(values) {
    const { utils: { isAddress } } = web3;
    const { newAddress } = values;
    const errors = {};
    if (!isAddress(newAddress)) errors.newAddress = 'Please enter a valid address'
    if (Object.keys(errors).length) throw errors;
  },
  async handleSubmit(values, { setSubmitting }) {
    const { newAddress, domainName } = values;
    const { methods: { moveDomain } } = ENSSubdomainRegistry;
    const hashedDomain = hash(domainName);
    console.log(
      `inputs for moveDomain of domain name: ${domainName}`,
      newAddress,
      hashedDomain,
    );

    moveDomain(newAddress, hashedDomain)
      .send()
      .then((res) => {
        setSubmitting(false);
        console.log(res);
      })
      .catch((err) => {
        setSubmitting(false);
        console.log(err);
      })
  }
})(InnerForm);

export default MoveDomain;
