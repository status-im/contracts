import React from 'react';
import Proposal from './proposal';

const ProposalList = props =>
  <React.Fragment>
    {props.proposals.map((u, i) => (
      <Proposal key={i} data={u} />
    ))}
  </React.Fragment>

export default ProposalList;
