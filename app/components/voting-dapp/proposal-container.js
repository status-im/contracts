import web3 from "Embark/web3"
import EmbarkJS from 'Embark/EmbarkJS';
import React from 'react';

import ProposalForm from './proposal-form';
import Proposal from './proposal';
import ProposalList from './proposal-list';

class ProposalContainer extends React.Component {

    constructor(props) {
      super(props);
      this.state = {
          proposals: []
      };
    }

    componentDidMount(){
        this.fetchProposals(_p => this.setState({proposals: _p}));
    }

    fetchProposals(cb){
        // TODO: populate proposals
        cb([1, 2, 3]);
    }

    render(){
        return <ProposalList proposals={this.state.proposals} />;
    }

}

export default ProposalContainer;
