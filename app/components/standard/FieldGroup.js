import React from 'react';
import { FormGroup, FormControl, HelpBlock, ControlLabel } from 'react-bootstrap';

const FieldGroup = ({ id, label, error, ...props }) => (
  <FormGroup controlId={id} validationState={error ? 'error' : null}>
    <ControlLabel>{label}</ControlLabel>
    <FormControl {...props} />
    {error && <HelpBlock>{error}</HelpBlock>}
  </FormGroup>
)

export default FieldGroup;
