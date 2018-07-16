const excluded = {
  PROPER_LIGHT_CLIENT_SUPPORT : 3,
  IMPLEMENT_SECURITY_PRACTICES : 14,
  SHIP_1_0 : 16
};

export const getPolls = (number, pollMethod) => {
  const polls = [];
  for (let i = number-1; i >= 0; i--) {
    const poll = pollMethod(i).call();
    polls.push(poll);
  }
  return Promise.all(polls.reverse());
}

const excludedPolls = new Set(Object.values(excluded));
const exclusionFilter = (poll, idx) => !excludedPolls.has(idx);
export const omitPolls = polls => polls.filter(exclusionFilter);
