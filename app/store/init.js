import web3 from "Embark/web3"
import EmbarkJS from 'Embark/EmbarkJS'
import store from './configureStore'
import { fetchAndDispatchAccountsWithBalances } from '../actions/accounts'

const dispatch = action => store.dispatch(action)

export default () => {
  EmbarkJS.onReady((err) => {
    fetchAndDispatchAccountsWithBalances(web3, dispatch)
  })
}
