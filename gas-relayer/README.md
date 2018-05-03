# token-gas-relayer
Gas Relayer implementation for Idea #73


To execute the gas-relayer, you may use node / npm / nodemon
```
node src/service.js
npm start
nodemon src/service.js
```

How to send a message to this service (all accounts and privatekeys should be replaced by your own test data)
```
shh.post({pubKey: PUBLIC_KEY, ttl: 1000, powTarget: 1, powTime: 20, topic: TOPIC_NAME, payload: PAYLOAD_BYTES});
```
- `PUBLIC_KEY` must contain the whisper public key used. It is shown on the console when running the service with `node`. With the provided configuration you can use the value:
```
0x044f1ee672354e54eab177ac4d5ce689d8b1f3d41dfc9778f494b99919c0cef9138f821611aecf84f1f2b972b5490d559e521a7a551f69c63e527ba29fbc06406a`
```
- `TOPIC_NAME` must contain one of the topic names generated based on converting the contract name to hex, and taking the first 8 bytes. For the provided configuration the following topics are available:
- - IdentityGasRelay: `0x4964656e`
- - SNTController: `0x534e5443`
- `PAYLOAD_BYTES` a hex string that contains the identity/contract address to invoke and the web3 encoded abi function invocation plus parameters. If we were to execute `callGasRelayed(address,uint256,bytes,uint256,uint256,uint256,address,bytes)` in contract `0x692a70d2e424a56d2c6c27aa97d1a86395877b3a`, with these values: `"0x11223344556677889900998877665544332211",100,"0x00",1,10,20,"0x1122334455"` `PAYLOAD_BYTES` would contain the following hex string, where the first 20 bytes are the contract address, the next 4 bytes are the function signature (`0xfd0dded5`), and the rest of the values are the encoded parameters
```
0x692a70d2e424a56d2c6c27aa97d1a86395877b3afd0dded50000000000000000000000000011223344556677889900998877665544332211000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000011223344550000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000000430783030000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
```

Before executing this program, `config.json` must be setup. Important values to verify are related to the node configuration, and addresses, and token accepted.