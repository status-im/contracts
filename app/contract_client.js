import {
  NonceTxMiddleware, SignedTxMiddleware, Client,
  Contract, Address, LocalAddress, CryptoUtils, LoomProvider
} from 'loom-js'

import Web3 from 'web3'

export default class ContractClient {
  constructor() {}

  async createContract() {
    const privateKey = CryptoUtils.generatePrivateKey()
    const publicKey = CryptoUtils.publicKeyFromPrivateKey(privateKey)

    const client = new Client(
      'default',
      'ws://127.0.0.1:46657/websocket',
      'ws://127.0.0.1:9999/queryws',
    )

    const from = LocalAddress.fromPublicKey(publicKey).toString()
    const web3 = new Web3(new LoomProvider(client, privateKey))
    const ABI = [{"constant":false,"inputs":[{"name":"_tileState","type":"string"}],"name":"SetTileMapState","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"GetTileMapState","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"state","type":"string"}],"name":"OnTileMapStateUpdate","type":"event"}]

    const loomContractAddress = await client.getContractAddressAsync('TilesChain')
    const contractAddress = CryptoUtils.bytesToHexAddr(loomContractAddress.local.bytes)

    this.contract = new web3.eth.Contract(ABI, contractAddress, {from})

    this.contract.events.OnTileMapStateUpdate({}, (err, event) => {
      if (err) return;
      if (this.onEvent) {
        this.onEvent(event)
      }
    })
  }

  async setTileMapState(data) {
    await this.contract.methods.SetTileMapState(data).send()
  }

  async getTileMapState() {
    return await this.contract.methods.GetTileMapState().call()
  }
}
