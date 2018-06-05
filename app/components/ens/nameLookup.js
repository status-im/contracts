import React, { Fragment } from 'react';
import Field from '../../ui/components/Field'
import TextInput from '../../ui/components/TextInput'

const NameLookup = () => (
  <div>
    <Field label="Enter Domain or Status Name" wide>
      <TextInput wide required />
    </Field>
  </div>
)

export default NameLookup;
