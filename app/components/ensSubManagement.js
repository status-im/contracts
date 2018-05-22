import EmbarkJS from 'Embark/EmbarkJS';
import ENSSubdomainRegistry from 'Embark/contracts/ENSSubdomainRegistry';
import React, { Fragment } from 'react';
import { Form, FormGroup, FormControl, HelpBlock, Button, ControlLabel } from 'react-bootstrap';
import AddDomain from './ens/addDomain'

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
    <AddDomain />
  </Fragment>
)

export default ENSSubManagement
