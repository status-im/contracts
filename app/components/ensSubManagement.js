import EmbarkJS from 'Embark/EmbarkJS';
import ENSRegistry from 'Embark/contracts/ENSRegistry';
import React, { Fragment } from 'react';
import { Form, FormGroup, FormControl, HelpBlock, Button, ControlLabel } from 'react-bootstrap';
import AddDomain from './ens/addDomain'
import SetupENS from './ens/setupENS'

const FieldGroup = ({ id, label, help, ...props }) => (
  <FormGroup controlId={id}>
    <ControlLabel>{label}</ControlLabel>
    <FormControl {...props} />
    {help && <HelpBlock>{help}</HelpBlock>}
  </FormGroup>
)

const ENSSubManagement = (props) => (
  <Fragment>
    <h2 style={{textAlign: 'center'}}>Subdomain Management</h2>
    <h3>Add Domain</h3>
    <AddDomain />
    <hr/>
    <SetupENS ENSRegistry={ENSRegistry} />
  </Fragment>
)

//console.log(ENSRegistry);
setTimeout(() => ENSRegistry.getPastEvents(
  'allEvents',
  {},
  (err, res) => { console.log(err, res) }), 2000)
export default ENSSubManagement
