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
    <h2>Subdomain management</h2>
    <h3>Add Domain</h3>
    <form>
      <FieldGroup
        id="domainName"
        type="text"
        label="Domain Name"
      />
      <FieldGroup
        id="domainPrice"
        type="number"
        label="Domain Price"
        placeholder="(Optional) Domain will be free if left blank"
      />
      <Button type="submit">Submit</Button>
    </form>
  </Fragment>
)

export default ENSSubManagement
