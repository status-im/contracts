import web3 from "Embark/web3"
import EmbarkJS from 'Embark/EmbarkJS';
import React from 'react';

import ProposalForm from './proposal-form';
import Proposal from './proposal';
import ProposalList from './proposal-list';
import Paginator from './paginator';

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
        let proposalList = [
            {
                description: "0x68747470733a2f2f69646561732e7374617475732e696d2f69646561732f3038382d646170702d657870657269656e6365",
                approved: true
            },
            {
                description: "0x68747470733a2f2f69646561732e7374617475732e696d2f69646561732f3039302d6272616e63682d706572662d7374617473",
                approved: true
            }
        ]

        cb(proposalList);
    }

    render(){
        return <React.Fragment>
            <ProposalList proposals={this.state.proposals} />
            <Paginator />
            </React.Fragment>;
    }

}

export default ProposalContainer;
