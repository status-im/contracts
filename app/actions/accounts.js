import { actions as accountActions } from '../reducers/accounts'

const { receiveAccounts } = accountActions
export const fetchAndDispatchAccountsWithBalances = (web3, dispatch) => {
  web3.eth.getAccounts((err, addresses) => {
    if (addresses) {
      const defaultAccount = web3.eth.defaultAccount || addresses[0]
      const accounts = addresses.map(async address => {
        const balance = await web3.eth.getBalance(address, 'latest')
        return { address, balance }
      })
      Promise.all(accounts).then(accounts => {
        dispatch(receiveAccounts(defaultAccount, accounts))
      })
    }
  })
}
