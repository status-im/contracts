import web3 from "Embark/web3"
import EmbarkJS from 'Embark/EmbarkJS'
import store from './configureStore'
import { fetchAndDispatchAccountsWithBalances, checkAndDispatchStatusContactCode } from '../actions/accounts'

const dispatch = action => store.dispatch(action)

export default () => {
  __embarkContext.execWhenReady(async () => {
    fetchAndDispatchAccountsWithBalances(web3, dispatch)
    checkAndDispatchStatusContactCode(dispatch)
  })
}
