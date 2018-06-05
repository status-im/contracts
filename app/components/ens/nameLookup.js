import React, { Fragment } from 'react';
import { Button, Field, TextInput, Card } from '../../ui/components'

const cardStyle = {
  width: '75%',
  marginLeft: '15%',
  padding: '30px'
}

const NameLookup = () => (
  <Card style={cardStyle}>
    <Field label="Enter Domain or Status Name" wide>
      <TextInput wide required />
    </Field>
    <Button mode="strong" type="submit" wide>
      Get Address
    </Button>
  </Card>
)

export default NameLookup;
