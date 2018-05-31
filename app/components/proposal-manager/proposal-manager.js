import EmbarkJS from 'Embark/EmbarkJS';
import ERC20Token from 'Embark/contracts/ERC20Token';
import ProposalCuration from 'Embark/contracts/ProposalCuration';
import SNT from 'Embark/contracts/SNT';
import React, { PureComponent, Fragment } from 'react';
import { Form, FormGroup, FormControl, HelpBlock, Button, Alert } from 'react-bootstrap';
import web3 from "Embark/web3";
import { withFormik } from 'formik';
import FieldGroup from '../standard/FieldGroup';
import TokenPermissions from '../standard/TokenPermission'

const { setSubmitPrice } = ProposalCuration.methods;
class InnerForm extends PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      submitPrice: "Loading...",
      canSubmit: true
    };
  }

  componentDidMount(){
    this.loadPrice();
  }

  componentWillReceiveProps(){
    this.loadPrice();
  }

  async loadPrice(){
    __embarkContext.execWhenReady(async () => {
      try {
        let _b = await ProposalCuration.methods.getSubmitPrice(web3.eth.defaultAccount).call();
        this.setState({
          submitPrice: _b,
          canSubmit: true
        });
      } catch(err){
        this.setState({
          canSubmit: false,
          submitPrice: "-"
        });
      }
    });
  }

  setPrice = (address = web3.eth.defaultAccount, allowed = true, stakeValue = 1) => {
    setSubmitPrice(address, allowed, stakeValue)
      .send()
      .then(res => {
        this.setState({ ...state, canSubmit: true });
        console.log(res);
      })
      .catch(err => { console.log(err) })
  }

  render() {
    const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue } = this.props;
    const { canSubmit } = this.state;
    return (
      <Fragment>
        {!canSubmit &&
         <Alert bsStyle="warning">
           Account not allowed to submit proposals <Button onClick={(e) => this.setPrice()}>Click to enable (Admin only)</Button>
         </Alert>
        }
        <TokenPermissions methods={SNT.methods} spender={ProposalCuration._address} symbol='SNT' />
        <hr/>
        <h2>Add proposal</h2>
        <h3>Price: {this.state.submitPrice}</h3>
        <Form onSubmit={handleSubmit}>
          <FieldGroup
            id="title"
            name="title"
            type="text"
            label="Title"
            onChange={handleChange}
            onBlur={handleBlur}
            value={values.title}
          />
          <FieldGroup
            id="description"
            name="description"
            type="text"
            label="Description"
            onChange={handleChange}
            onBlur={handleBlur}
            value={values.description}
          />
          <FieldGroup
            id="url"
            name="url"
            type="text"
            label="URL"
            onChange={handleChange}
            onBlur={handleBlur}
            value={values.url}
          />
          <Button type="submit" disabled={!canSubmit || isSubmitting}>{isSubmitting ? 'Submission in progress' : 'Submit'}</Button>
        </Form>
      </Fragment>
    )
  }
}

const ProposalManager = withFormik({
  mapPropsToValues: props => ({ title: '', description: '', url: '' }),
  validate(values) {},
  handleSubmit(values, { setSubmitting}){
    const { title, description, url } = values;
    const { saveText } = EmbarkJS.Storage;
    const { toHex } = web3.utils;
    const { submitProposal } = ProposalCuration.methods;
    saveText(JSON.stringify(description))
      .then(hash => {
        const hexHash = toHex(hash);
        //TODO create toggle for address approval
        submitProposal(
          "0x00",
          "0x0000000000000000000000000000000000000000",
          0,
          "0x00",
          hexHash
        )
          .send({from: web3.eth.defaultAccount, gasLimit: 1000000})
          .then(res => {
            setSubmitting(false);
            console.log(res);
          })
          .catch(err => {
            setSubmitting(false);
            //TODO show error
            console.log('Storage saveText Error: ', err.message)
          });
      })
  }
})(InnerForm)

export default ProposalManager;
