import web3 from "Embark/web3"
import EmbarkJS from 'Embark/EmbarkJS';
import React from 'react';
import ProposalContainer from './proposal-container';
import StatusBar from './status-bar';

const VotingDapp = props =>
    <div>
        <StatusBar {...props} />
        <ProposalContainer />
    </div>;

export default VotingDapp;
