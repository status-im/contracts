import web3 from "Embark/web3"
import EmbarkJS from 'Embark/EmbarkJS';
import React, {Component, Fragment} from 'react';
import { Button } from 'react-bootstrap';
import ProposalManager from 'Embark/contracts/ProposalManager';
import ProposalCuration from 'Embark/contracts/ProposalCuration';

class Voting extends Component {

    constructor(props) {
      super(props);
      this.state = {
          decision: 0,
          finalResult: null
        };
    }

    componentWillReceiveProps(){
        __embarkContext.execWhenReady(async () => {
            this._loadProposalData();
        });
    }

    componentDidMount(){
        __embarkContext.execWhenReady(async () => {
            this._loadProposalData();
        });
    }

    async _loadProposalData() {
        ProposalManager.options.address = await ProposalCuration.methods.proposalManager().call();
            let _proposal = await ProposalManager.methods.getVoteInfo(this.props.proposalId, web3.eth.defaultAccount).call();
            let blockNum = await web3.eth.getBlockNumber();
            let _data = await ProposalManager.methods.proposals(this.props.proposalId).call();

            this.setState({
                data: _data,
                decision: _proposal.vote,
                block: blockNum,
                finalResult: _data.result
            });
    }

    async determineFinalResult(e){
        e.preventDefault();

        let receipt = await ProposalManager.methods.finalResult(this.props.proposalId)
                                .send({from: web3.eth.defaultAccount});

        if(receipt.status == '0x1'){
            this.setState({
                finalResult: receipt.events.ProposalResult.returnValues.finalResult
            });
        }
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
        let blockNum = await web3.eth.getBlockNumber();


        if(receipt.status == '0x1'){
            this.setState({
                decision: choice,
                block: blockNum
            });
        }
        // TODO: handle error
    }

    render(){
        return <div>
            {
                this.state.decision != 0 ?
                <p>You voted for: <ResultChoice decision={this.state.decision} /></p>
                : ''
            }

            {
                this.state.data != null && this.state.block < this.state.data.voteBlockEnd ?
                <Fragment>
                    <Button onClick={(e) => this.handleClick(e, 'APPROVE') }>Approve</Button>
                    <Button onClick={(e) => this.handleClick(e, 'REJECT') }>Reject</Button>
                </Fragment>
                : ''
            }

            {
                this.state.data != null && this.state.block >= this.state.data.voteBlockEnd && this.state.data.result == 0 ?
                <Button onClick={(e) => this.determineFinalResult(e) }>Determine final result</Button>
                : ''
            }

            { this.state.data != null ?
            <ul>
                <li>Voting ends on block: {this.state.data.voteBlockEnd }</li>
                <li>Current Block: { this.state.block }</li>
                <li>Final Result: <ResultChoice decision={this.state.finalResult} /></li>
            </ul>
            : '' }

        </div>;
    }
}


const ResultChoice = props =>
<span>{props.decision.toString() == '1' ? 'REJECT' : props.decision.toString() == '2' ? 'APPROVE' : ''}</span>





export default Voting;
