import EmbarkJS from 'Embark/EmbarkJS';
import MessageTribute from '../../embarkArtifacts/contracts/MessageTribute';
import React from 'react';
import { Form, FormGroup, FormControl, HelpBlock, Button } from 'react-bootstrap';

class Blockchain extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      valueSet: 10,
      paramGet: "",
      valueGet: "",
      logs: []
    };
  }

  valueSet(e) {
    this.setState({ valueSet: e.target.value });
  }

  paramGet(e) {
    this.setState({ paramGet: e.target.value });
  }


  checkEnter(e, func) {
    if (e.key !== 'Enter') {
      return;
    }
    e.preventDefault();
    func.apply(this, [e]);
  }

  async setValue(e) {
    e.preventDefault();
    await EmbarkJS.enableEthereum();
    MessageTribute.methods.setManifest(this.state.valueSet).send();
    this._addToLog("MessageTribute.methods.setManifest("+this.state.valueSet+").send()");
  }

  getValue(e) {
    e.preventDefault();

    MessageTribute.methods.getManifest(this.state.paramGet).call().then(_value => this.setState({ valueGet: _value }));
    this._addToLog("MessageTribute.methods.getManifest("+this.state.paramGet+")");
  }

  _addToLog(txt) {
    this.state.logs.push(txt);
    this.setState({ logs: this.state.logs });
  }

  render() {
    return (<React.Fragment>
        <h3> 1. Set the value in the blockchain</h3>
        <Form inline onKeyDown={(e) => this.checkEnter(e, this.setValue)}>
          <FormGroup>
            <FormControl
              type="text"
              defaultValue={this.state.valueSet}
              onChange={(e) => this.valueSet(e)}/>
            <Button bsStyle="primary" onClick={(e) => this.setValue(e)}>Set Manifest</Button>
            <HelpBlock>Once you set the value, the transaction will need to be mined and then the value will be updated
              on the blockchain.</HelpBlock>
          </FormGroup>
        </Form>

        <h3> 2. Get the current value of an account</h3>
        <Form inline>
          <FormGroup>
          <FormControl
              type="text"
              defaultValue={this.state.paramGet}
              onChange={(e) => this.paramGet(e)}/>
            <HelpBlock>current value is <span className="value">{this.state.valueGet}</span></HelpBlock>
            <Button bsStyle="primary" onClick={(e) => this.getValue(e)}>Get Manifest</Button>
            <HelpBlock>Click the button to get the current value. The initial value is 100.</HelpBlock>
          </FormGroup>
        </Form>

        <h3> 3. Contract Calls </h3>
        <p>Javascript calls being made: </p>
        <div className="logs">
          {
            this.state.logs.map((item, i) => <p key={i}>{item}</p>)
          }
        </div>
      </React.Fragment>
    );
  }
}

export default Blockchain;
