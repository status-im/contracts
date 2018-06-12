import React, { Fragment } from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import TopNavbar from './topnavbar';
import TestTokenUI from './testtoken';
import ERC20TokenUI from './erc20token';
import ENSSubManagement from './ensSubManagement';
import NameLookup from './ens/nameLookup';


const AdminMode = () => (
  <Fragment>
    <TopNavbar />
    <Tabs defaultActiveKey={1} id="uncontrolled-tab-example">
      <Tab eventKey={1} title="TestToken">
        <TestTokenUI />
      </Tab>
      <Tab eventKey={2} title="ERC20Token">
        <ERC20TokenUI />
      </Tab>
      <Tab eventKey={3} title="ENS Management">
        <ENSSubManagement />
      </Tab>
      <Tab eventKey={4} title="Name Lookup">
        <NameLookup />
      </Tab>
    </Tabs>
  </Fragment>
);

export default AdminMode;
