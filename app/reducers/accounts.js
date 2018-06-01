import { createTypes, actionCreator } from 'redux-action-creator'

export const types = createTypes([
  'RECEIVE_ACCOUNTS'
], 'ACCOUNTS')
export const actions = {
  receiveAccounts: actionCreator(types.RECEIVE_ACCOUNTS, 'defaultAccount','accounts')
}

export default function(state = { loading: true, accounts: [] }, action) {
  switch (action.type) {
  case types.RECEIVE_ACCOUNTS:
    const { defaultAccount, accounts } = action.payload
    return {
      ...state,
      loading: false,
      defaultAccount,
      accounts
    }
  default:
    return state;
  }
}

export const getAccounts = state => state.accounts.accounts;
export const accountsIsLoading = state => state.accounts.loading;
