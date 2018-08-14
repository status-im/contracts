import Web3 from 'web3';

const config = {
    'provider': new Web3.providers.HttpProvider('http://localhost:8545'),
    'account': '0xb8d851486d1c953e31a44374aca11151d49b8bb3'
}

export default config;