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
          finalResult: null,
          data: null,
          tabulationAvailable: false,
          votingAvailable: false
        };
    }

    componentWillReceiveProps(){
        __embarkContext.execWhenReady(async () => {
            this._loadProposalData();
        });
    }

    async _loadProposalData() {
        ProposalManager.options.address = await ProposalCuration.methods.proposalManager().call();
        const _votingInfo = await ProposalManager.methods.getVoteInfo(this.props.proposalId, web3.eth.defaultAccount).call();
        const _blockNum = await web3.eth.getBlockNumber();
        const _data = await ProposalManager.methods.proposals(this.props.proposalId).call();
        
        const _votingAvailable = await ProposalManager.methods.isVotingAvailable(this.props.proposalId).call();
        const _tabulationAvailable = await ProposalManager.methods.isTabulationAvailable(this.props.proposalId).call();
        const _voteTabulated = await ProposalManager.methods.isDelegatorVoteTabulated(this.props.proposalId, web3.eth.defaultAccount).call();
        const _canCalculateFinalResult = await ProposalManager.methods.canCalculateFinalResult(this.props.proposalId).call();

        this.setState({
            data: _data,
            decision: _votingInfo.vote,
            block: _blockNum,
            finalResult: _data.result,
            votingAvailable: _votingAvailable,
            tabulationAvailable: _tabulationAvailable,
            canCalculateFinalResult: _canCalculateFinalResult,
            voteTabulated: _voteTabulated
        });
    }

    async determineFinalResult(e){
        e.preventDefault();

        let receipt = await ProposalManager.methods.finalResult(this.props.proposalId)
                                .send({from: web3.eth.defaultAccount, gasLimit: 1000000});
        if(receipt.status == '0x1'){
            this.setState({
                finalResult: receipt.events.ProposalResult.returnValues.finalResult,
                finalResultAvailable: false
            });
        } 
    }

    async tabulateVote(e){
        e.preventDefault();

        const receipt = await ProposalManager.methods.tabulateVote(this.props.proposalId, web3.eth.defaultAccount)
                                .send({from: web3.eth.defaultAccount, gasLimit: 1000000});

        // TODO: handle error

        this._loadProposalData();
    }

    async handleClick(e, vote){
        e.preventDefault();

        let choice = 0;
        if(vote == 'APPROVE')
            choice = 2;
        else
            choice = 1;

        const proposal = this.props.proposalId;
        const receipt = await ProposalManager.methods.voteProposal(this.props.proposalId, choice)
                        .send({from: web3.eth.defaultAccount});
        
        const _votingAvailable = await ProposalManager.methods.isVotingAvailable(this.props.proposalId).call();
        const _tabulationAvailable = await ProposalManager.methods.isTabulationAvailable(this.props.proposalId).call();
        const _voteTabulated = await ProposalManager.methods.isDelegatorVoteTabulated(this.props.proposalId, web3.eth.defaultAccount).call();
        const _canCalculateFinalResult = await ProposalManager.methods.canCalculateFinalResult(this.props.proposalId).call();

        const blockNum = await web3.eth.getBlockNumber();

        if(receipt.status == '0x1'){
            this.setState({
                decision: choice,
                block: blockNum,
                votingAvailable: _votingAvailable,
                tabulationAvailable: _tabulationAvailable,
                finalResultAvailable: _canCalculateFinalResult,
                voteTabulated: _voteTabulated
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
                this.state.data != null && this.state.votingAvailable ?
                <Fragment>
                    <Button onClick={(e) => this.handleClick(e, 'APPROVE') }>Approve</Button>
                    <Button onClick={(e) => this.handleClick(e, 'REJECT') }>Reject</Button>
                </Fragment>
                : ''
            }

            {
                this.state.data != null && this.state.tabulationAvailable && !this.state.voteTabulated ?
                <Button onClick={(e) => this.tabulateVote(e) }>Tabulate your vote</Button>
                : ''
            }

            {
                
                this.state.finalResultAvailable ?
                <Button onClick={(e) => this.determineFinalResult(e) }>Determine final result</Button>
                : !this.state.tabulationAvailable && !this.state.voteTabulated ?
                  <p>Final results aren't available yet</p> : ''
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
