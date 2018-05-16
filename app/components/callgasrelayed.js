import Web3 from 'web3';

import React from 'react';
import { Grid, Row, Form, FormGroup, FormControl, HelpBlock, Button, ControlLabel, Col, InputGroup, Alert } from 'react-bootstrap';
import AccountBalance from './accountBalance'; 

class CallGasRelayed extends React.Component {

    constructor(props) {
      super(props);

      this.state = {
        account: '0x1847ab5a71eaa95315c3fc2d3dfb53b7e6e8f313',
        address: this.props.IdentityGasRelay.options.address,
        topic: '0x4964656e',
        to: '0x00',
        value: 0,
        data: '0x00',
        nonce: 0,
        gasPrice: 0,
        gasLimit: 0,
        gasToken: "0x0000000000000000000000000000000000000000",
        signature: '',
        symKey: '0xd0d905c1c62b810b787141430417caf2b3f54cffadb395b7bb39fdeb8f17266b',
        kid: null,
        skid: null,
        msgSent: '',
        payload: '',
        messages: [],
        web3W: null, 
        errorMessage: ''
      }; 
    }

    componentDidMount(){
      __embarkContext.execWhenReady(async () => {

        let web3W = new Web3('ws://localhost:8546');

        let _skid = await web3W.shh.addSymKey(this.state.symKey);
        let _kid = await web3W.shh.newKeyPair();
        
        this.setState({
          kid: _kid,
          skid: _skid,
          whisper: web3W
        });

        web3W.shh.subscribe('messages', {
          "privateKeyID": _kid,
          "ttl": 20,
          "minPow": 0.8,
          "powTime": 1000
        }, (error, message, subscription) => {
            if(error) {
              console.log(error);
              this.setState({errorMessage: error.message})
            } else {
              this.state.messages.push(this.props.web3.utils.hexToAscii(message.payload));
              this.setState({messages: this.state.messages})
            }
        });



      });
    }

    handleChange(e, name){
      this.state[name] = e.target.value;
      this.setState(this.state);
    }

    async sendMessage(e){
      
      e.preventDefault();

      this.setState({
        messages: [],
        errorMessage: ''
      });

      try {
        let jsonAbi = this.props.IdentityGasRelay._jsonInterface.filter(x => x.name == "callGasRelayed")[0]
        let funCall = this.props.web3.eth.abi.encodeFunctionCall(jsonAbi, [this.state.to, 
                                                                this.state.value, 
                                                                this.state.data, 
                                                                this.state.nonce, 
                                                                this.state.gasPrice, 
                                                                this.state.gasLimit,
                                                                this.state.gasToken,
                                                                this.state.signature]);
        let msgObj = { 
          symKeyID: this.state.skid, 
          sig: this.state.kid,
          ttl: 1000, 
          powTarget: 1, 
          powTime: 20, 
          topic: this.state.topic, 
          payload: this.props.web3.utils.toHex({
            'address': this.state.address,
            'encodedFunctionCall': funCall
          })
        };

        console.log(msgObj);

        this.props.web3.shh.post(msgObj)
          .then((err, result) => {
            console.log(result);
            console.log(err);
              this.setState({msgSent: result, payload: msgObj.payload});
          });
      } catch(error){
        console.error(error);
        this.setState({errorMessage: error.message})
      }
    }


    async sign(ev){
      ev.preventDefault();

      this.setState({
        msgSent: false,
        payload: '',
        messages: [],
        errorMessage: ''
      });

      try {
        let message = await this.props.IdentityGasRelay.methods.callGasRelayHash(
            this.state.to,
            this.state.value,
            this.props.web3.utils.soliditySha3({t: 'bytes', v: this.state.data}),
            this.state.nonce,
            this.state.gasPrice,
            this.state.gasLimit,
            this.state.gasToken
          ).call();

        let accounts = await this.props.web3.eth.getAccounts();
        let _signature = await this.props.web3.eth.sign(message, accounts[0]);

        this.setState({signature: _signature});
      } catch(error){
        console.error(error);
        this.setState({errorMessage: error.message})
      }
    }

    render(){
      return (<Grid>
        {
            this.state.errorMessage != '' ?
            <React.Fragment>
              <Alert bsStyle="danger">{this.state.errorMessage}</Alert>
            </React.Fragment> : ''
        }
        <Form>
          <Row>
            <Col md={3}>
              <AccountBalance name="Identity" address={this.state.address} web3={this.props.web3} RND={this.props.RND} />
            </Col>
            <Col md={3}>
              <AccountBalance name="To" address={this.state.to} web3={this.props.web3} RND={this.props.RND} />
            </Col>
            <Col md={3}>
              <AccountBalance name="Gas Relayer Node" address={this.state.account} web3={this.props.web3} RND={this.props.RND} />
            </Col>
          </Row>
          <Row>
            <Col md={9}>
              <ControlLabel>Identity Address</ControlLabel>
              <InputGroup> 
                <InputGroup.Addon>0x</InputGroup.Addon>
                <FormControl type="text" placeholder="Address" defaultValue={this.state.address} onChange={(ev) => this.handleChange(ev, 'address')}  />
              </InputGroup>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <ControlLabel>To</ControlLabel>
              <InputGroup> 
                <InputGroup.Addon>0x</InputGroup.Addon>
                <FormControl type="text" defaultValue={this.state.to} onChange={(ev) => this.handleChange(ev, 'to')} />
              </InputGroup>
            </Col>
            <Col md={1}> 
              <ControlLabel>Value</ControlLabel>
              <FormControl type="string" defaultValue={this.state.value} onChange={(ev) => this.handleChange(ev, 'value')} />
            </Col>
            <Col md={4}>
              <ControlLabel>Data</ControlLabel>
              <InputGroup> 
                <InputGroup.Addon>0x</InputGroup.Addon>
                <FormControl type="string" defaultValue={this.state.data} onChange={(ev) => this.handleChange(ev, 'data')} />
              </InputGroup>
            </Col>
          </Row>
          <Row>
            <Col md={1}>
              <ControlLabel>Nonce</ControlLabel>
              <FormControl type="string" defaultValue={this.state.nonce} onChange={(ev) => this.handleChange(ev, 'nonce')} />
            </Col>
            <Col md={1}>
              <ControlLabel>Gas Price in Tokens</ControlLabel>
              <FormControl type="string" defaultValue={this.state.gasPrice} onChange={(ev) => this.handleChange(ev, 'gasPrice')} />
            </Col>
            <Col md={1}>
              <ControlLabel>Gas Limit in Ether</ControlLabel>
              <FormControl type="string" defaultValue={this.state.gasLimit} onChange={(ev) => this.handleChange(ev, 'gasLimit')} />
            </Col>
            <Col md={6}>
              <ControlLabel>Gas Token</ControlLabel>
              <InputGroup> 
                <InputGroup.Addon>0x</InputGroup.Addon>
                <FormControl type="text" defaultValue={this.state.gasToken} onChange={(ev) => this.handleChange(ev, 'gasToken')} />
              </InputGroup>
              <HelpBlock>RND: {this.props.RND.options.address}</HelpBlock>
              <HelpBlock>ETH: 0x0000000000000000000000000000000000000000</HelpBlock>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <Button bsStyle="primary" onClick={(ev) => this.sign(ev)}>1. Sign Message</Button>
            </Col>
            <Col md={5}>
            <b>Signature: </b>{this.state.signature}
            </Col>
          </Row>
          <Row>
            <Col md={7}>
              <ControlLabel>Symmetric Key</ControlLabel>
              <InputGroup> 
                <InputGroup.Addon>0x</InputGroup.Addon>
                <FormControl type="text" placeholder="Sym Key" defaultValue={this.state.symKey} readOnly={true}  />
              </InputGroup>
            </Col>
            <Col md={2}>
              <ControlLabel>Topic</ControlLabel>
              <InputGroup> 
                <InputGroup.Addon>0x</InputGroup.Addon>
                <FormControl type="text" readOnly={true} defaultValue={this.state.topic} onChange={(ev) => this.handleChange(ev, 'topic')} />
              </InputGroup>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <Button bsStyle="primary" disabled={this.state.signature == ""} onClick={(ev) => this.sendMessage(ev)}>2. Send via whisper</Button>
            </Col>
            <Col md={5}>
              {this.state.msgSent}
            </Col>
          </Row>
          
          <Row>
            <h3>Whisper Messages</h3>
            {
              this.state.messages.map((msg, i) => <p key={i}>{msg}</p>)
            }
          </Row>
        </Form>
      </Grid>
      );
    }
  }

  export default CallGasRelayed;