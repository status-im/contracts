import { createTypes, actionCreator } from 'redux-action-creator'

export const types = createTypes([
  'RECEIVE_ACCOUNTS'
], 'ACCOUNTS')
export const actions = {
  receiveAccounts: actionCreator(types.RECEIVE_ACCOUNTS, 'accounts')
}

export default function accounts(state = [], action) {
  switch (action.type) {
  case types.RECEIVE_ACCOUNTS:
    return { ...state, ...action.accounts }
  default:
    return state;
  }
}

export const getAccounts = state => state.accounts;
