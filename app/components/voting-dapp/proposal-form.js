import web3 from "Embark/web3"
import EmbarkJS from 'Embark/EmbarkJS';
import React, {Component, Fragment} from 'react';
import { Button } from 'react-bootstrap';
import ProposalManager from 'Embark/contracts/ProposalManager';
import ProposalCuration from 'Embark/contracts/ProposalCuration';

class ProposalForm extends Component {

    constructor(props) {
      super(props);
      this.state = {
          decision: 0
      };
    }

    componentDidMount(){
        __embarkContext.execWhenReady(async () => {
            ProposalManager.options.address = await ProposalCuration.methods.proposalManager().call();
            let proposal = await ProposalManager.methods.getProposal(this.props.proposalId).call();
            this.setState({decision: proposal.vote});
        });
    }

    async handleClick(e, vote){
        e.preventDefault();

        let choice = 0;
        if(vote == 'APPROVE')
            choice = 2;
        else
            choice = 1;

        let proposal = this.props.proposalId;
        let receipt = await ProposalManager.methods.voteProposal(this.props.proposalId, choice)
                        .send({from: web3.eth.defaultAccount});

        if(receipt.status == '0x1'){
            this.setState({
                decision: choice
                // TODO:  show results
            });
        }
        console.log(receipt);

        // TODO: handle error
    }

    render(){
        console.log(this.state);
        return <div>
            {
                this.state.decision != 0 ?
                <span>You voted for: {this.state.decision.toString() == '1' ? 'REJECT' : 'APPROVE'}<br /></span>
                : ''
            }
            <Button onClick={(e) => this.handleClick(e, 'APPROVE') }>Approve</Button>
            <Button onClick={(e) => this.handleClick(e, 'REJECT') }>Reject</Button>
            <b><br />TODO: Verify if vote is allowed for this proposal</b>
            <b><br />TODO: Show time until proposal votation is closed</b>
        </div>;
    }
}

export default ProposalForm;
