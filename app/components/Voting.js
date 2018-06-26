import React, { Fragment } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import 'typeface-roboto';
import AppBar from './standard/AppBar';

export default ({ toggleAdmin }) => (
  <Fragment>
    <CssBaseline />
    <AppBar toggleAdmin={toggleAdmin} />
  </Fragment>
)
