import React, { Fragment, PureComponent } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import 'typeface-roboto';
import AppBar from './standard/AppBar';
import AddPoll from './simple-voting/AddPoll';
import PollsList from './simple-voting/PollsList';
import StatusLogo from '../ui/components/StatusLogo';
import Collapse from '@material-ui/core/Collapse';
import Hidden from '@material-ui/core/Hidden';
import Typography from '@material-ui/core/Typography';
import LinearProgress from '@material-ui/core/LinearProgress';
import { VotingContext } from '../context';

class Voting extends PureComponent {
  state = { addPoll: false };

  render(){
    const { addPoll } = this.state;
    const togglePoll = () => { this.setState({ addPoll: !addPoll })};
    return (
      <VotingContext.Consumer>
        {({ getPolls, rawPolls, loading }) =>
          <div>
            <CssBaseline />
            <AppBar togglePoll={togglePoll} />
            {loading && <LinearProgress />}
            <div style={{ margin: '30px', textAlign: 'center' }}>
              <img src="images/logo.png" width="200" />
              <Hidden smUp>
                <Typography variant="headline" color="inherit">
                  What should we build next?
                </Typography>
              </Hidden>
            </div>
            <Collapse in={addPoll}>
              <AddPoll togglePoll={togglePoll} getPolls={getPolls} />
            </Collapse>
            {rawPolls && <PollsList rawPolls={rawPolls}  />}
          </div>
        }
      </VotingContext.Consumer>
    )
  }
}

export default Voting
