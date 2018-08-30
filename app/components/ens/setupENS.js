import React, { Fragment } from 'react';
import { Form, FormGroup, FormControl, HelpBlock, Button, ControlLabel } from 'react-bootstrap';
import UsernameRegistrar from 'Embark/contracts/UsernameRegistrar';
import web3Utils from 'web3-utils'
import { hash } from 'eth-ens-namehash'

const zeroBytes32 = "0x0000000000000000000000000000000000000000000000000000000000000000";
const getUserAddress = contract => contract._provider.publicConfigStore._state.selectedAddress;
const dispatchSetup = (ENSRegistry) => {
  const { methods: { setSubnodeOwner } } = ENSRegistry;
  const { sha3 } = web3Utils
  setSubnodeOwner(zeroBytes32, sha3('eth'), getUserAddress(ENSRegistry))
    .send()
    .then(res => { console.log(res) })
  setSubnodeOwner(hash('eth'), sha3('stateofus'), UsernameRegistrar._address)
    .send()
    .then(res => { console.log(res) })
  setSubnodeOwner(hash('eth'), sha3('stateofus'), UsernameRegistrar._address)
    .send()
    .then(res => { console.log(res) })
}
const SetupEns = ({ ENSRegistry }) => (
  <Fragment>
    <Button bsStyle="primary" onClick={() => dispatchSetup(ENSRegistry)}>ADD INITIAL NODES TO ENS</Button>
  </Fragment>
)

export default SetupEns;
