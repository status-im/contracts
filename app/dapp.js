import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';

import EmbarkJS from 'Embark/EmbarkJS';
import AdminView from './components/AdminView';
import Voting from './components/Voting';
import SNT from  'Embark/contracts/SNT';
window['SNT'] = SNT;

import './dapp.css';

class App extends React.Component {

  constructor(props) {
    super(props);
  }
  state = { admin: false };

  componentDidMount(){
    __embarkContext.execWhenReady(() => {
    });
  }

  setAccount(_account){
    this.setState({account: _account});
  }

  _renderStatus(title, available) {
    let className = available ? 'pull-right status-online' : 'pull-right status-offline';
    return <Fragment>
      {title}
      <span className={className}></span>
    </Fragment>;
  }

  render(){
    const { admin } = this.state;
    const toggleAdmin = () => this.setState({ admin: true });
    return (
      <Fragment>
        {admin ? <AdminView setAccount={this.setAccount} /> : <Voting toggleAdmin={toggleAdmin} />}
      </Fragment>
    );
  }
}

ReactDOM.render(<App></App>, document.getElementById('app'));
