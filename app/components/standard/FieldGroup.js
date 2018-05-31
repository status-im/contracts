import React from 'react';
import { FormGroup, FormControl, HelpBlock, ControlLabel, InputGroup } from 'react-bootstrap';

const FieldGroup = ({ id, label, button, error, ...props }) => (
  <FormGroup controlId={id} validationState={error ? 'error' : null}>
    <ControlLabel>{label}</ControlLabel>
    {button
     ? <InputGroup>
       <InputGroup.Button>
         {button}
       </InputGroup.Button>
       <FormControl {...props} />
     </InputGroup>
     : <FormControl {...props} />
    }
    {error && <HelpBlock>{error}</HelpBlock>}
  </FormGroup>
)

export default FieldGroup;
