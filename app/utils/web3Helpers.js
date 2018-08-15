import web3 from "Embark/web3"
import BigNumber from 'bignumber.js';

// By default BigNumber's `toString` method converts to exponential notation if the value has
// more then 20 digits. We want to avoid this behavior, so we set EXPONENTIAL_AT to a high number
BigNumber.config({
  EXPONENTIAL_AT: 1000,
});
const unlimitedAllowance = new BigNumber(2).pow(256).sub(1);
export const getDefaultAccount = () => web3.eth.defaultAccount;
export const toggleApproved = (token, spender, approved, onlyApprove = false) => {
  const isApproved = !!Number(approved);
  if (isApproved && onlyApprove) return;
  const { approve } = token.methods;
  const amountToApprove = isApproved ? 0 : unlimitedAllowance;
  return approve(spender,amountToApprove).send();
}
