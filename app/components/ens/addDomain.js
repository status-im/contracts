import ENSSubdomainRegistry from 'Embark/contracts/ENSSubdomainRegistry';
import React, { Fragment } from 'react';
import { Form, FormGroup, FormControl, HelpBlock, Button, ControlLabel } from 'react-bootstrap';
import { withFormik } from 'formik';
import { hash } from 'eth-ens-namehash'
import { debounce } from 'lodash/fp'


const delay = debounce(1000);
const getDomain = (hashedDomain, domains) => domains(hashedDomain).call();
const fetchDomain = delay(getDomain);
const setPrice = (domainFn, hashedDomain, price) => domainFn(hashedDomain, price || 0).send()

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
    if (!domainName) errors.domainName = 'Required';
    return errors;
  },
  async handleSubmit(values, { setSubmitting }) {
    const { domainName, domainPrice } = values
    const { methods: { domains, addDomain, setDomainPrice } } = ENSSubdomainRegistry
    const hashedDomain = hash(domainName);
    const { state } = await getDomain(hashedDomain, domains);
    setPrice(
      !!state ? setDomainPrice : addDomain,
      hashedDomain,
      domainPrice
    )
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

export default AddDomain;
