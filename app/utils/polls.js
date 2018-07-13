
export const getPolls = (number, pollMethod) => {
  const polls = [];
  for (let i = number-1; i >= 0; i--) {
    const poll = pollMethod(i).call();
    polls.push(poll);
  }
  return Promise.all(polls.reverse());
}

const unVotedDupes = new Set([3]);
const filterDupes = (poll, idx) => !unVotedDupes.has(idx);
export const omitUnvotedDupes = polls => polls.filter(filterDupes);
