import { connect } from 'react-redux';
import TokenPermissions from './TokenPermission';
import { getCurrentAccount, accountsIsLoading } from '../../reducers/accounts';

const mapStateToProps = state => ({
  account: getCurrentAccount(state),
  isLoading: accountsIsLoading(state),
});
export default connect(mapStateToProps)(TokenPermissions);
