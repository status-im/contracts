import React, { Fragment } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import 'typeface-roboto';
import AppBar from './standard/AppBar';
import AddPoll from './simple-voting/AddPoll';
import PollsList from './simple-voting/PollsList';
import StatusLogo from '../ui/components/StatusLogo';

export default ({ toggleAdmin, rawPolls }) => (
  <Fragment>
    <CssBaseline />
    <AppBar toggleAdmin={toggleAdmin} />
    <div style={{ margin: '15px 15px 15px 35%' }}>
      <StatusLogo />
    </div>
    <AddPoll />
    {rawPolls && <PollsList rawPolls={rawPolls} />}
  </Fragment>
)
