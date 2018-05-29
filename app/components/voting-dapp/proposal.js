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

    componentDidMount(){
        __embarkContext.execWhenReady(() => {
            EmbarkJS.Storage.get(this.props.data.description)
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
            <ProposalForm  />
        </div>);
    }

}


export default Proposal;
