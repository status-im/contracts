import UsernameRegistrar from 'Embark/contracts/UsernameRegistrar';
import web3 from 'web3';
import React from 'react';
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
    const { newAddress } = values;
    const { methods: { moveDomain } } = UsernameRegistrar;
    console.log(
      `inputs for moveDomain:}`,
      newAddress
    );

    moveDomain(newAddress)
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
