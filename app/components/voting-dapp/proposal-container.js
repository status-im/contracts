import web3 from "Embark/web3"
import EmbarkJS from 'Embark/EmbarkJS';
import React, {Component, Fragment} from 'react';
import ProposalForm from './proposal-form';
import Proposal from './proposal';
import ProposalList from './proposal-list';
import Paginator from './paginator';
import ProposalManager from 'Embark/contracts/ProposalManager';
import ProposalCuration from 'Embark/contracts/ProposalCuration';

const pageLength = 4;
class ProposalContainer extends Component {

    constructor(props) {
      super(props);
      this.state = {
          proposals: [],
          total: 0,
          page: 1
      };
      window['ProposalCuration'] = ProposalCuration;
    }

    componentDidMount(){
        __embarkContext.execWhenReady(async () => {
            ProposalManager.options.address = await ProposalCuration.methods.proposalManager().call();
            await this.getTotalProposals();
            await this.getProposalsOnPage(this.state.page);
        });
    }

    async getTotalProposals(){
        let proposalCount = await ProposalManager.methods.getProposalCount().call();
        this.setState({
            total: parseInt(proposalCount)
        });
   }

    async getProposalsOnPage(pageNum){
        this.fetchProposals((pageNum - 1) * pageLength, pageLength, 
            _p => {
                this.setState({
                    proposals: _p, 
                    page: pageNum
                });
            });
    }

    async fetchProposals(from, qty, cb){
        let proposalList = [];
        for(let i = from; i < from + qty && i < this.state.total; i++){
            let res = await ProposalCuration.methods.proposals(i).call();
            res.id = i;
            proposalList.push(res);
        }
        cb(proposalList);
    }

    render(){
        return <Fragment>
            <ProposalList proposals={this.state.proposals} />
            <Paginator total={this.state.total} recordsByPage={pageLength} page={this.state.page} pageHandler={(e, pageNum) => this.getProposalsOnPage(pageNum) } />
            </Fragment>;
    }

}

export default ProposalContainer;
