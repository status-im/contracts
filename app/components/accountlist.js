import web3 from 'Embark/web3'
import React from 'react';
import { connect } from 'react-redux';
import { Nav, MenuItem, NavDropdown } from 'react-bootstrap';
import Blockies from 'react-blockies';
import { string, bool, func, arrayOf, shape } from 'prop-types';
import { getAccounts, getDefaultAccount, accountsIsLoading, actions as accountActions } from '../reducers/accounts';
import './accountlist.css';

const AccList = ({
  accounts, defaultAccount, changeAccount, isLoading, classNameNavDropdown,
}) => (
  <React.Fragment>
    {!isLoading ?
      <div className="accounts">
        <div className="selectedIdenticon">
          <Blockies seed={defaultAccount} />
        </div>
        <div className="accountList">
          <Nav>
            <NavDropdown key={1} title={defaultAccount} id="basic-nav-dropdown" className={classNameNavDropdown}>
              {accounts.map(account => (
                <MenuItem key={account.address} onClick={() => changeAccount(account.address)}>
                  <div className="account">
                    <div className="accountIdenticon">
                      <Blockies seed={account.address} />
                    </div>
                    <div className="accountHexString">
                      {account.address}
                    </div>
                    <div className="accountBalance">
                      Ξ {account.balance / (10 ** 18)}
                    </div>
                  </div>
                </MenuItem>
              ))}
            </NavDropdown>
          </Nav>
        </div>
      </div>
     : <div>Loading...</div>}
  </React.Fragment>
);

AccList.propTypes = {
  accounts: arrayOf(shape({ address: string, balance: string })).isRequired,
  defaultAccount: string,
  changeAccount: func.isRequired,
  isLoading: bool.isRequired,
  classNameNavDropdown: string
}

const mapStateToProps = state => ({
  accounts: getAccounts(state),
  defaultAccount: getDefaultAccount(state),
  isLoading: accountsIsLoading(state),
});

const mapDispatchToProps = dispatch => ({
  changeAccount(address) {
    web3.eth.defaultAccount = address;
    dispatch(accountActions.updateDefaultAccount(address));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(AccList);
