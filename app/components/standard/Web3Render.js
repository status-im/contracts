import React, { Fragment } from 'react';
import NoConnection from './NoConnection';

const Web3Render = ({ ready, children, network }) => (
  <Fragment>
    {ready ? <Fragment>{children}</Fragment> : <NoConnection network={network} />}
  </Fragment>
);

export default Web3Render;
