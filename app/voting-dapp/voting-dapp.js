import web3 from "Embark/web3"
import EmbarkJS from 'Embark/EmbarkJS';
import React from 'react';

import ProposalForm from './proposal-form';
import Proposal from './proposal';
import ProposalList from './proposal-list';

class ProposalForm extends React.Component {

    constructor(props) {
      super(props);
      this.state = {};
    }

    render(){
        return <div>
            <ProposalList />
            <ProposalForm />
        </div>;
    }

}

module.exports = ProposalForm;
