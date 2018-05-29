import web3 from "Embark/web3"
import EmbarkJS from 'Embark/EmbarkJS';
import React from 'react';
import { Button } from 'react-bootstrap';

class ProposalForm extends React.Component {

    constructor(props) {
      super(props);
      this.state = {};
    }

    handleClick(e){
        e.preventDefault();

        
    }

    render(){
        return <div>
            <Button onClick={(e) => this.handleClick(e) }>Vote</Button>
        </div>;
    }

}

export default ProposalForm;
