import React, { Fragment } from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import TopNavbar from './topnavbar';
import TestTokenUI from './testtoken';
import ERC20TokenUI from './erc20token';
import ProposalManager from './proposal-manager/proposal-manager'
import VotingDapp from './voting-dapp/voting-dapp';
import SNTUI from './snt-ui';

export default ({ setAccount }) => {
  return (
    <div class="container">
      <TopNavbar accountUpdateHandler={(e) => setAccount(e)} />
      <Tabs defaultActiveKey={0} id="uncontrolled-tab-example">
        <Tab eventKey={0} title="VotingDapp">
          <VotingDapp />
        </Tab>
        <Tab eventKey={1} title="ProposalManager">
          <ProposalManager />
        </Tab>
        <Tab eventKey={2} title="SNT Token">
          <SNTUI />
        </Tab>
        <Tab eventKey={3} title="TestToken">
          <TestTokenUI />
        </Tab>
        <Tab eventKey={4} title="ERC20Token">
          <ERC20TokenUI />
        </Tab>
      </Tabs>
    </div>
  )
}
