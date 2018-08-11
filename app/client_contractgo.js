import {
  NonceTxMiddleware, SignedTxMiddleware, Client,
  Contract, Address, LocalAddress, CryptoUtils
} from 'loom-js'

import { TileMapState, TileMapTx } from './proto/dots_pb'

export default class ContractClient {
  constructor() {}

  async createContract() {
    const privateKey = CryptoUtils.generatePrivateKey()
    const publicKey = CryptoUtils.publicKeyFromPrivateKey(privateKey)

    const client = new Client(
      'default',
      'wss://draw.status.im/websocket',
      'wss://draw.status.im/queryws',
    )
    // required middleware
    client.txMiddleware = [
      new NonceTxMiddleware(publicKey, client),
      new SignedTxMiddleware(privateKey)
    ]
    // address of the `TileChain` smart contract on the Loom DAppChain
    const contractAddr = await client.getContractAddressAsync('TileChain')

    this.callerAddress = new Address(client.chainId, LocalAddress.fromPublicKey(publicKey))
    this.contract = new Contract({
      contractAddr,
      callerAddr: this.callerAddress,
      client
    })
  }

  async setTileMapState(data) {
    const setTileMapState = new TileMapTx()
    setTileMapState.setData(data)
    await this.contract.callAsync('SetTileMapState', setTileMapState)
  }

  async getTileMapState() {
    return await this.contract.staticCallAsync('GetTileMapState', new TileMapState(), new TileMapState())
  }
}
