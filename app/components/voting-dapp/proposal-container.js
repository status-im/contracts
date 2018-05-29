import web3 from "Embark/web3"
import EmbarkJS from 'Embark/EmbarkJS';
import React from 'react';

import ProposalForm from './proposal-form';
import Proposal from './proposal';
import ProposalList from './proposal-list';
import Paginator from './paginator';

const pageLength = 10;
class ProposalContainer extends React.Component {

    constructor(props) {
      super(props);
      this.state = {
          proposals: [],
          total: 10,  // TODO get total
          page: 1
      };
    }

    componentDidMount(){
        this.getProposalsOnPage(this.state.page);
    }

    getProposalsOnPage(pageNum){
        this.fetchProposals((pageNum - 1) * pageLength, pageLength, _p => this.setState({proposals: _p, page: pageNum}));
    }

    fetchProposals(from, qty, cb){

        console.log("Loading %s records starting from record %s", qty, from);

        // TODO: populate proposals
        let proposalList = [
            {
                description: "QmZ4hQ5jKUqtHEXhXDVSz81JexMoDmVfiypECFQZZibyrS",
                approved: true
            }
        ]

        cb(proposalList);
    }

    render(){
        return <React.Fragment>
            <ProposalList proposals={this.state.proposals} />
            <Paginator total={this.state.total} recordsByPage={pageLength} page={this.state.page} pageHandler={(e, pageNum) => this.getProposalsOnPage(pageNum) } />
            </React.Fragment>;
    }

}

export default ProposalContainer;
