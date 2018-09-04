import EmbarkJS from 'Embark/EmbarkJS';
import ENSRegistry from 'Embark/contracts/ENSRegistry';
import UsernameRegistrar from 'Embark/contracts/UsernameRegistrar';
import TestToken from 'Embark/contracts/TestToken';
import React, { Fragment } from 'react';
import { Form, FormGroup, FormControl, HelpBlock, Button, ControlLabel } from 'react-bootstrap';
import AddDomain from './ens/addDomain';
import MoveDomain from './ens/moveDomain';
import RegisterSubDomain from './ens/registerSubDomain';
import TokenPermissions from './standard/TokenPermission';
import SetupENS from './ens/setupENS';
import UpdateController from './ens/updateController';

const FieldGroup = ({ id, label, help, ...props }) => (
  <FormGroup controlId={id}>
    <ControlLabel>{label}</ControlLabel>
    <FormControl {...props} />
    {help && <HelpBlock>{help}</HelpBlock>}
  </FormGroup>
)

const ENSSubManagement = props => (
  <Fragment>
    <h2 style={{ textAlign: 'center' }}>Subdomain Management</h2>
    <h3>Change Registry Controller</h3>
    <UpdateController />
    <h3>Activate Registry/Update Registry Price</h3>
    <AddDomain />
    <h3>Move Domain To Another Registry</h3>
    <MoveDomain />
    <hr/>
    <h3>Register Sub-Domain</h3>
    <RegisterSubDomain />
    <hr/>
    <TokenPermissions
      symbol='SNT'
      spender={UsernameRegistrar._address}
      methods={TestToken.methods} />
    <hr/>
    <SetupENS ENSRegistry={ENSRegistry} />
  </Fragment>
)

export default ENSSubManagement;
