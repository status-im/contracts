export default class Events {
  constructor() {
    this.ws = new WebSocket('wss://draw.status.im/queryws')

    this.ws.onopen = () => {

      // subscribe to events
      this.ws.send(JSON.stringify({
        method: 'subevents',
        jsonrpc: '2.0',
        params: {},
        id: 'events'
      }))

      // on new event
      this.ws.onmessage = event => this.onMessage(event)
    }
  }

  onMessage(event) {
    const data = JSON.parse(event.data)
    const encodedData = data.result.encoded_body

    // there's an useful encoded that
    if (encodedData) {
      const dAppEvent = JSON.parse(atob(encodedData))

      // tile map state updated
      if (this.onEvent && dAppEvent.Method == 'onTileMapStateUpdate') {
        const parsedData = JSON.parse(dAppEvent.Data)
        this.onEvent(parsedData)
      }
    }
  }
}
