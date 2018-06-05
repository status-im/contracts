import ENSSubdomainRegistry from 'Embark/contracts/ENSSubdomainRegistry';
import ENSRegistry from 'Embark/contracts/ENSRegistry';
import React, { Fragment } from 'react';
import { Button } from 'react-bootstrap';
import FieldGroup from '../standard/FieldGroup'
import { withFormik } from 'formik';
import { hash } from 'eth-ens-namehash'
import { debounce } from 'lodash/fp'

const { methods: { owner } } = ENSRegistry;

const delay = debounce(250);
const getDomain = (hashedDomain, domains) => domains(hashedDomain).call();
const registryIsOwner = address => address == ENSSubdomainRegistry._address;
const fetchOwner = domainName => owner(hash(domainName)).call();
const debounceFetchOwner = delay(fetchOwner);
const getAndIsOwner = async domainName => {
  const address = await debounceFetchOwner(domainName);
  return registryIsOwner(address);
}
const fetchDomain = delay(getDomain);
const setPrice = (domainFn, hashedDomain, price) => domainFn(hashedDomain, price || 0).send();

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
    <Button bsStyle="primary" type="submit" disabled={isSubmitting || !!Object.keys(errors).length}>{!isSubmitting ? 'Submit' : 'Submitting to the Blockchain - (this may take awhile)'}</Button>
  </form>
)

const AddDomain = withFormik({
  mapPropsToValues: props => ({ domainName: '', domainPrice: '' }),
  async validate(values, props) {
    const { domainName } = values
    const errors = {};
    if (!domainName) errors.domainName = 'Required';
    if (domainName && !await getAndIsOwner(domainName)) errors.domainName = 'This domain is not owned by registry'
    if (Object.keys(errors).length) throw errors;
  },
  async handleSubmit(values, { setSubmitting }) {
    const { domainName, domainPrice } = values
    const { methods: { domains, setDomainPrice, updateDomainPrice } } = ENSSubdomainRegistry
    const { sha3 } = window.web3.utils
    const hashedDomain = hash(domainName)
    const { state } = await getDomain(hashedDomain, domains);
    setPrice(
      !!Number(state) ? updateDomainPrice : setDomainPrice,
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
