import web3 from "Embark/web3"
import EmbarkJS from 'Embark/EmbarkJS';
import React from 'react';

import ProposalForm from './proposal-form';
import ProposalContainer from './proposal-container';

class VotingDapp extends React.Component {

    constructor(props) {
      super(props);
      this.state = {
          
      };
    }

    render(){
        return <div>
            <ProposalContainer />
            <ProposalForm />
        </div>;
    }

}

export default VotingDapp;
