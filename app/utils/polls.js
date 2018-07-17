import web3 from "Embark/web3"
import MiniMeTokenInterface from 'Embark/contracts/MiniMeTokenInterface';

const excluded = {
  PROPER_LIGHT_CLIENT_SUPPORT : 3,
  IMPLEMENT_SECURITY_PRACTICES : 14,
  SHIP_1_0 : 16
};

export const getBalance = async (idPoll, token, startBlock) => {
  const { fromWei } = web3.utils;
  const { balanceOfAt } = MiniMeTokenInterface.methods;
  MiniMeTokenInterface.options.address = token;
  const balance = await balanceOfAt(web3.eth.defaultAccount, startBlock - 1).call();
  return fromWei(balance);
}

export const getPolls = async (number, pollMethod) => {
  const polls = [];
  for (let i = number-1; i >= 0; i--) {
    const poll = await pollMethod(i).call();
    const balance = await getBalance(i, poll._token, poll._startBlock);
    polls.push({ ...poll, balance });
  }
  return polls.reverse();
}

const excludedPolls = new Set(Object.values(excluded));
const exclusionFilter = (poll, idx) => !excludedPolls.has(idx);
export const omitPolls = polls => polls.filter(exclusionFilter);
