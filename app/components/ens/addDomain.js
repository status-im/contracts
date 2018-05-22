import ENSSubdomainRegistry from 'Embark/contracts/ENSSubdomainRegistry';
import React, { Fragment } from 'react';
import { Form, FormGroup, FormControl, HelpBlock, Button, ControlLabel } from 'react-bootstrap';
import { withFormik } from 'formik';
import { hash } from 'eth-ens-namehash'

const FieldGroup = ({ id, label, error, ...props }) => (
  <FormGroup controlId={id} validationState={error ? 'error' : null}>
    <ControlLabel>{label}</ControlLabel>
    <FormControl {...props} />
    {error && <HelpBlock>{error}</HelpBlock>}
  </FormGroup>
)

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
      id="domainName"
      name="domainName"
      type="text"
      label="Domain Name"
      onChange={handleChange}
      onBlur={handleBlur}
      value={values.domainName}
      error={errors.domainName}
    />
    <FieldGroup
      id="domainPrice"
      name="domainPrice"
      type="number"
      label="Domain Price"
      placeholder="(Optional) Domain will be free if left blank"
      onChange={handleChange}
      onBlur={handleBlur}
      value={values.domainPrice}
    />
    <Button bsStyle="primary" type="submit" disabled={isSubmitting}>{!isSubmitting ? 'Submit' : 'Submitting to the Blockchain - (this may take awhile)'}</Button>
  </form>
)

const AddDomain = withFormik({
  mapPropsToValues: props => ({ domainName: '', domainPrice: '' }),
  validate(values, props) {
    const errors = {};
    if (!values.domainName) errors.domainName = 'Required';
    return errors;
  },
  handleSubmit(values, { setSubmitting }) {
    const { domainName, domainPrice } = values
    const { methods: { addDomain } } = ENSSubdomainRegistry
    addDomain(hash(domainName), domainPrice || 0)
      .send()
      .then(res => {
        setSubmitting(false);
        console.log(res);
      })
      .catch(err => {
        setSubmitting(false);
        console.log(err);
      })
  }
})(InnerForm)

setTimeout(() => {ENSSubdomainRegistry.methods.controller().call().then(console.log)}, 2000)
export default AddDomain;
