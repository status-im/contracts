import React from 'react';
import Proposal from './proposal';

const ProposalList = props =>
  <React.Fragment>
    {props.proposals.map(u => (
      <Proposal data={u} />
    ))}
  </React.Fragment>

  module.exports = ProposalList;
  