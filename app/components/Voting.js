import React, { Fragment } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import 'typeface-roboto';
import AppBar from './standard/AppBar';
import AddPoll from './simple-voting/AddPoll';
import PollsList from './simple-voting/PollsList';

export default ({ toggleAdmin, rawPolls }) => (
  <Fragment>
    <CssBaseline />
    <AppBar toggleAdmin={toggleAdmin} />
    <AddPoll />
    {rawPolls && <PollsList rawPolls={rawPolls} />}
  </Fragment>
)
