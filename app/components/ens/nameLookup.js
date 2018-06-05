import React, { Fragment } from 'react';
import { Button, Field, TextInput, Card } from '../../ui/components'
import { withFormik } from 'formik';
import PublicResolver from 'Embark/contracts/PublicResolver';
import { hash } from 'eth-ens-namehash';

const formatName = domainName => domainName.includes('.') ? domainName : `${domainName}.stateofus.eth`;
const cardStyle = {
  width: '75%',
  marginLeft: '15%',
  padding: '30px'
}

const InnerForm = ({
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  handleSubmit,
  isSubmitting,
}) => (
  <Card style={cardStyle}>
    <form onSubmit={handleSubmit}>
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
  </Card>
)

const NameLookup = withFormik({
  mapPropsToValues: props => ({ domainName: '' }),
  handleSubmit(values, { setSubmitting }) {
    const { domainName } = values;
    PublicResolver.methods.addr(hash(formatName(domainName)))
                  .call()
                  .then(res =>{
                    console.log('addr', res);
                  });
  }
})(InnerForm)

export default NameLookup;
