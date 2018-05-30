import React from 'react';
import $ from 'jquery';
import { Button, Alert } from 'react-bootstrap';
import EmbarkJS from 'Embark/EmbarkJS';
import ProposalForm from './proposal-form';

class Proposal extends React.Component {

    constructor(props) {
      super(props);
      this.state = {
          url: null,
          title: null,
          description: null,
          error: null
      };
    }

    componentDidUpdate(prevProps, prevState, snapshot){
        if(prevProps.data.description !== this.props.data.description)
            this.getProposalData();
    }

    componentDidMount(){
        __embarkContext.execWhenReady(() => {
            this.getProposalData();
        });
    }

    getProposalData(){
        let hash = web3.utils.toAscii(this.props.data.description);
        EmbarkJS.Storage.get(hash)
            .then((content) => {
                let jsonObj = JSON.parse(content);
                this.setState({
                    url: jsonObj.url,
                    title: jsonObj.title,
                    description: jsonObj.description
                })
            })
            .catch((err) => {
                if(err){
                    console.log("Storage get Error => " + err.message);
                }
            });
    }

    render(){
        return (<div>
            {
                this.state.error !== null ?
                <Alert bsStyle="warning">
                { this.state.error }
                </Alert>
                : ''
            }
            <h3>{ this.state.title }</h3>
            <p>{ this.state.description }</p>
            <a href={ this.state.url } target="_blank">{ this.state.url }</a>
            <ProposalForm proposalId={this.props.data.id}  />
        </div>);
    }

}


export default Proposal;
