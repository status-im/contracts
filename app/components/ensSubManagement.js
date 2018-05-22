import EmbarkJS from 'Embark/EmbarkJS';
import ENSSubdomainRegistry from 'Embark/contracts/ENSSubdomainRegistry';
import React, { Fragment } from 'react';
import { Form, FormGroup, FormControl, HelpBlock, Button, ControlLabel } from 'react-bootstrap';

const FieldGroup = ({ id, label, help, ...props }) => (
  <FormGroup controlId={id}>
    <ControlLabel>{label}</ControlLabel>
    <FormControl {...props} />
    {help && <HelpBlock>{help}</HelpBlock>}
  </FormGroup>
)

const ENSSubManagement = (props) => (
  <Fragment>
    <h2> Subdomain management</h2>
    <form>
      <FieldGroup
        id="updateUsername"
        type="text"
        label="Update Username"
      />
      <FieldGroup
        id="updateAddress"
        type="text"
        label="Update Address"
      />
      <FieldGroup
        id="updateUsername"
        type="text"
        label="Update Pubkey"
      />
    </form>
  </Fragment>
)

export default ENSSubManagement
