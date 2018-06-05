import EmbarkJS from 'Embark/EmbarkJS';
import ENSRegistry from 'Embark/contracts/ENSRegistry';
import ENSSubdomainRegistry from 'Embark/contracts/ENSSubdomainRegistry';
import PublicResolver from 'Embark/contracts/PublicResolver';
import TestToken from 'Embark/contracts/TestToken';
import React, { Fragment } from 'react';
import { Form, FormGroup, FormControl, HelpBlock, Button, ControlLabel } from 'react-bootstrap';
import AddDomain from './ens/addDomain';
import RegisterSubDomain from './ens/registerSubDomain';
import TokenPermissions from './standard/TokenPermission';
import SetupENS from './ens/setupENS';
import { hash } from 'eth-ens-namehash';

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
    <h3>Add/Update Domain Price</h3>
    <AddDomain />
    <hr/>
    <h3>Register Sub-Domain</h3>
    <RegisterSubDomain />
    <hr/>
    <TokenPermissions
      symbol='SNT'
      spender={ENSSubdomainRegistry._address}
      methods={TestToken.methods} />
    <hr/>
    <SetupENS ENSRegistry={ENSRegistry} />
  </Fragment>
)
setTimeout(() => ENSRegistry.getPastEvents(
  'allEvents',
  {},
  (err, res) => {
    PublicResolver.methods.addr(hash('bobby.stateofus.eth')).call().then(res =>{
      console.log('addr', res);
    });
    console.log(err, res) }), 2000)

export default ENSSubManagement;
