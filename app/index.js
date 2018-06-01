import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import store from './store/configureStore';
import App from './dapp';
import init from './store/init'
import './dapp.css';

init();

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('app')
);
