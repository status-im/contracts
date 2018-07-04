import React, { Fragment } from 'react';

const NoWeb3 = () => (
  <div>
    NO WEB3 Provider detected
  </div>
)

const Web3Render = ({ ready, children }) => (
  <Fragment>
    {ready ? <Fragment>{children}</Fragment> : <NoWeb3 />}
  </Fragment>
);

export default Web3Render;
