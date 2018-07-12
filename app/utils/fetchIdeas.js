import axios from 'axios';

const repoFilter = (repo) => {
  const { path } = repo;
  if (path.includes('ideas')) {
    const split = path.split('/');
    if (split.length < 3) return true;
    if (path.includes('README')) return true;
  }
  return false;
}

const convertToUrl = (repo) => {
  const { path } = repo;
  const base = 'https://ideas.status.im/';
  const suffix = path.split('.md')[0];
  return `${base}${suffix}`;
}

const fetchContent = async () => {
  const response = await axios.get('https://api.github.com/repos/status-im/ideas/git/trees/master?recursive=1');
  return response['data']['tree'].filter(repoFilter).map(convertToUrl);
}

const pluckIdeas = async () => {
  const data = await fetchContent();
  return data;
}
export default pluckIdeas;

