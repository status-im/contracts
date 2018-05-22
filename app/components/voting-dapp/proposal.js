import React from 'react';
import $ from 'jquery';
import {Button} from 'react-bootstrap';

class Proposal extends React.Component {

    constructor(props) {
      super(props);
      this.state = {
          url: web3.utils.toAscii(props.data.description),
          content: ''
      };
    }

    componentDidMount(){
        fetch(this.state.url)
            .then((res) => {
                return res.text();
            })
            .then((data) => {
                data = data.replace(/<svg.+\/svg>/, '');
                this.setState({'content': data});
            });
    }

    render(){
        let $content = $(this.state.content);
        const title = $('h1.post-title', $content).text();
        const summary = $('h2#summary', $content).next().text();

        return (<div>
            <h3>{ title }</h3>
            <a href={ this.state.url } target="_blank">{ this.state.url }</a>
            <p>{summary}</p>
            <Button bsStyle="primary">Vote</Button>
            <Button bsStyle="link">Cancel</Button>
        </div>);
    }

}


export default Proposal;
