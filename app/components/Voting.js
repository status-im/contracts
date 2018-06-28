import React, { Fragment, PureComponent } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import 'typeface-roboto';
import AppBar from './standard/AppBar';
import AddPoll from './simple-voting/AddPoll';
import PollsList from './simple-voting/PollsList';
import StatusLogo from '../ui/components/StatusLogo';

class Voting extends PureComponent {
  state = { addPoll: false };

  render(){
    const { toggleAdmin, rawPolls } = this.props;
    const { addPoll } = this.state;
    const togglePoll = () => { this.setState({ addPoll: !addPoll })};
    return (
      <Fragment>
        <CssBaseline />
        <AppBar toggleAdmin={toggleAdmin} togglePoll={togglePoll} />
        <div style={{ margin: '30px', textAlign: 'center' }}>
          <img src="images/logo.png" width="200" />
        </div>
        {addPoll && <AddPoll togglePoll={togglePoll} />}
        {rawPolls && <PollsList rawPolls={rawPolls} />}
      </Fragment>
    )
  }
}

export default Voting
