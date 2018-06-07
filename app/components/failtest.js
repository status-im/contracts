import EmbarkJS from 'Embark/EmbarkJS';
import FailTest from 'Embark/contracts/FailTest';
import React from 'react';
import { Form, FormGroup, FormControl, HelpBlock, Button } from 'react-bootstrap';

const CASES = [
    { value: '0', label: "SUCCESS"},
    { value: '1', label: "FAIL_1" },
    { value: '2', label: "FAIL_2" },
    { value: '3', label: "FAIL_3" },
    { value: '4', label: "FAIL_4" },
    { value: '5', label: "FAIL_5" },
    { value: '6', label: "FAIL_6" }
]

class FailTestUI extends React.Component {

    constructor(props) {
      super(props);
      this.state = {
        stringToInput: "",
        testcaseSelected: '0',
        dataStorage: ""
      }      
         
    }
  
    handleStringChange(e){
      this.setState({stringToInput: e.target.value});
    }
    
    updateCase (e) {
        console.log(e)
		this.setState({
			testcaseSelected: e.target.value
		});
    }

    
    readDataStorage(e){
        e.preventDefault();
        console.log("Reading dataStored()");
        if (EmbarkJS.isNewWeb3()) {
          FailTest.methods.dataStored().call()
            .then(_value => this.setState({dataStorage: _value}))
        } else {
            FailTest.dataStored()
            .then(_value => this.setState({dataStorage: _value}));
        }
      }
    

    testSimpleSend(e){
        e.preventDefault();
        var input = this.state.stringToInput;
        var testcase = this.state.testcaseSelected;
        console.log("SimpleSend: testMethod("+testcase+","+input+")");
        var r;
        if (EmbarkJS.isNewWeb3()) {
          r = FailTest.methods.testMethod(testcase,input).send().then(console.log);
        } else {
          r = FailTest.testMethod(testcase,input).then(console.log);
        }
        console.log(r);
      }
      
      testSend(e, gasLimit){
        e.preventDefault();
        var input = this.state.stringToInput;
        var testcase = this.state.testcaseSelected;
        console.log("SimpleSend: testMethod("+testcase+","+input+")");
        var r;
        if (EmbarkJS.isNewWeb3()) {
          r = FailTest.methods.testMethod(testcase,input).send({ gas: gasLimit }).then(console.log);
        } else {
             r = "test not implemented"
        }
        console.log(r);
      }

      testCall(e){
        e.preventDefault();
        var input = this.state.stringToInput;
        var testcase = this.state.testcaseSelected;
        console.log("Call: testMethod("+testcase+","+input+")");
        var r;
        if (EmbarkJS.isNewWeb3()) {
          r = FailTest.methods.testMethod(testcase,input).call().then(console.log);
        } else {
           r = "test not implemented"
        }
        console.log(r);
      }

      estimateGas(e){
        e.preventDefault();
        var input = this.state.stringToInput;
        var testcase = this.state.testcaseSelected;
        console.log("estimateGas: testMethod("+testcase+","+input+")");
        var r;
        if (EmbarkJS.isNewWeb3()) {
          r = FailTest.methods.testMethod(testcase,input).estimateGas().then(console.log);
        } else {
           r = "test not implemented"
        }
        console.log(r);
      }
    
    render(){
        var cases = CASES;
      return (<React.Fragment>
          <h3> Test Calls</h3>
          <Form inline>
            <FormGroup>
                <label>
                    Data To Store:
                </label>
                <FormControl
                    type="text"
                    defaultValue={this.state.stringToInput}
                    onChange={(e) => this.handleStringChange(e)} />
            </FormGroup>
            <FormGroup>
                <label>
                    Case:
                </label>
                <FormControl 
                    componentClass="select" 
                    placeholder="select"
                    value={this.state.testcaseSelected}
                    onChange={(e) => this.updateCase(e)}>

                    <option value="0">Success</option>
                    <option value="1">Fail by Throw</option>
                    <option value="2">Fail by Revert</option>
                    <option value="3">Fail by Require</option>
                    <option value="4">Fail by Require with Msg</option>
                    <option value="5">Fail by Revert with Msg</option>
                    <option value="6">Fail by Assert</option>
                </FormControl>
            </FormGroup>
            <FormGroup>
                <Button bsStyle="primary" onClick={(e) => this.estimateGas(e)}>eth.estimateGas</Button>
                <Button bsStyle="primary" onClick={(e) => this.testCall(e)}>Call</Button>
                <Button bsStyle="primary" onClick={(e) => this.testSimpleSend(e)}>Simple Send</Button>
                <Button bsStyle="primary" onClick={(e) => this.testSend(e, 21001)}>Low Gas Send</Button>
            </FormGroup>
          </Form>

        <h3> Read data storage</h3>
          <Form inline>
            <FormGroup>
              <label>
                Data Stored:
              </label>
              <label>
                <HelpBlock><span className="dataStorage">{this.state.dataStorage}</span></HelpBlock>
              </label>
              <label>
                <Button  bsStyle="primary" onClick={(e) => this.readDataStorage(e)}>Update</Button>
              </label>
            </FormGroup>
          </Form>

      </React.Fragment>
      );
    }
  }

  export default FailTestUI;