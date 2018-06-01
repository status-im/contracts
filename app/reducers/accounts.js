import { createTypes, actionCreator } from 'redux-action-creator'

export const types = createTypes([
  'RECEIVE_ACCOUNTS',
  'UPDATE_DEFAULT_ACCOUNT'
], 'ACCOUNTS')
export const actions = {
  receiveAccounts: actionCreator(types.RECEIVE_ACCOUNTS, 'defaultAccount','accounts'),
  updateDefaultAccount: actionCreator(types.UPDATE_DEFAULT_ACCOUNT, 'defaultAccount')
}

export default function(state = { loading: true, accounts: [] }, action) {
  switch (action.type) {
  case types.RECEIVE_ACCOUNTS: {
    const { defaultAccount, accounts } = action.payload
    return {
      ...state,
      loading: false,
      defaultAccount,
      accounts
    }
  }
  case types.UPDATE_DEFAULT_ACCOUNT: {
    const { defaultAccount } = action.payload
    return { ...state, defaultAccount }
  }
  default:
    return state;
  }
}

export const getAccountState = state => state.acounts;
export const getAccounts = state => state.accounts.accounts;
export const getDefaultAccount = state => state.accounts.defaultAccount;
export const accountsIsLoading = state => state.accounts.loading;
