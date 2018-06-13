import { createTypes, actionCreator } from 'redux-action-creator'
import { createSelector } from 'reselect'

export const types = createTypes([
  'RECEIVE_ACCOUNTS',
  'UPDATE_DEFAULT_ACCOUNT',
  'ADD_TO_SNT_TOKEN_BALANCE',
  'SUBTRACT_FROM_SNT_TOKEN_BALANCE'
], 'ACCOUNTS')
export const actions = {
  receiveAccounts: actionCreator(types.RECEIVE_ACCOUNTS, 'defaultAccount','accounts'),
  updateDefaultAccount: actionCreator(types.UPDATE_DEFAULT_ACCOUNT, 'defaultAccount'),
  addToSntTokenBalance: actionCreator(types.ADD_TO_SNT_TOKEN_BALANCE, 'amount'),
  subtractfromSntTokenBalance: actionCreator(types.SUBTRACT_FROM_SNT_TOKEN_BALANCE, 'amount')
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
  case types.ADD_TO_SNT_TOKEN_BALANCE: {
    const currentAccount = { ...getCurrentAccount({accounts: state}) }
    currentAccount.SNTBalance = Number(currentAccount.SNTBalance) + Number(action.payload.amount)
    const accounts = [ ...state.accounts ]
    const idx = accounts.findIndex(a => a.address === currentAccount.address)
    accounts[idx] = currentAccount
    return {
      ...state,
      accounts
    }
  }
  case types.SUBTRACT_FROM_SNT_TOKEN_BALANCE: {
    const currentAccount = { ...getCurrentAccount({accounts: state}) }
    currentAccount.SNTBalance = Number(currentAccount.SNTBalance) - Number(action.payload.amount)
    const accounts = [ ...state.accounts ]
    const idx = accounts.findIndex(a => a.address === currentAccount.address)
    accounts[idx] = currentAccount
    return {
      ...state,
      accounts
    }
  }
  default:
    return state;
  }
}

export const getAccountState = state => state.acounts;
export const getAccounts = state => state.accounts.accounts;
export const getDefaultAccount = state => state.accounts.defaultAccount;
export const accountsIsLoading = state => state.accounts.loading;
export const getCurrentAccount = createSelector(
  getDefaultAccount,
  getAccounts,
  (defaultAccount, accounts) => accounts.find(a => a.address === defaultAccount)
)
