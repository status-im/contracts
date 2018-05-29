import React from 'react';
import $ from 'jquery';
import {Button} from 'react-bootstrap';
import EmbarkJS from 'Embark/EmbarkJS';
import ProposalForm from './proposal-form';

class Proposal extends React.Component {

    constructor(props) {
      super(props);

      this.state = {
          url: null,
          title: null,
          description: null
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
                        // TODO handle error
                        console.log("Storage get Error => " + err.message);
                    }
                });
        });
    }

    render(){
        return (<div>
            <h3>{ this.state.title }</h3>
            <p>{ this.state.description }</p>
            <a href={ this.state.url } target="_blank">{ this.state.url }</a>
            <ProposalForm  />
        </div>);
    }

}


export default Proposal;
