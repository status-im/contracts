import React, {Fragment} from 'react';
import Proposal from './proposal';

const ProposalList = props =>
  <Fragment>
    {props.proposals.map((u, i) => (
      <Proposal key={i} data={u} />
    ))}
  </Fragment>

export default ProposalList;
