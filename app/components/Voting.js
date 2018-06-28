import React, { Fragment, PureComponent } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import 'typeface-roboto';
import AppBar from './standard/AppBar';
import AddPoll from './simple-voting/AddPoll';
import PollsList from './simple-voting/PollsList';
import StatusLogo from '../ui/components/StatusLogo';
import Collapse from '@material-ui/core/Collapse';
import { VotingContext } from '../context';

class Voting extends PureComponent {
  state = { addPoll: false };

  render(){
    const { addPoll } = this.state;
    const togglePoll = () => { this.setState({ addPoll: !addPoll })};
    return (
      <VotingContext.Consumer>
        {({ getPolls, rawPolls, toggleAdmin }) =>
          <Fragment>
            <CssBaseline />
            <AppBar toggleAdmin={toggleAdmin} togglePoll={togglePoll} />
            <div style={{ margin: '30px', textAlign: 'center' }}>
              <img src="images/logo.png" width="200" />
            </div>
            <Collapse in={addPoll}>
              <AddPoll togglePoll={togglePoll} getPolls={getPolls} />
            </Collapse>
            {rawPolls && <PollsList rawPolls={rawPolls}  />}
          </Fragment>
        }
      </VotingContext.Consumer>
    )
  }
}

export default Voting
