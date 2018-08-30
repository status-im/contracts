import web3 from "Embark/web3"
import UsernameRegistrar from 'Embark/contracts/UsernameRegistrar';
import PublicResolver from 'Embark/contracts/PublicResolver';
import TestToken from 'Embark/contracts/TestToken';
import React from 'react';
import { connect } from 'react-redux';
import Hidden from '@material-ui/core/Hidden';
import CircularProgress from '@material-ui/core/CircularProgress';
import { Button, MobileSearch, MobileButton, Field } from '../../ui/components';
import { withFormik } from 'formik';
import { hash } from 'eth-ens-namehash';
import { zeroAddress, zeroBytes32, formatPrice } from './utils';
import { getStatusContactCode, getSNTAllowance, getCurrentAccount } from '../../reducers/accounts';
import FieldGroup from '../standard/FieldGroup';
import LinearProgress from '@material-ui/core/LinearProgress';
import TokenPermissions from '../standard/TokenPermissionConnect';
import { generateXY } from '../../utils/ecdsa';

const { soliditySha3, fromWei } = web3.utils;

const InnerForm = ({
  values,
  errors,
  handleChange,
  handleBlur,
  handleSubmit,
  isSubmitting,
  setFieldValue,
  subDomain,
  domainName,
  domainPrice,
  editAccount,
  SNTAllowance,
  SNTBalance,
}) => (
  <form onSubmit={handleSubmit}>
    <div style={{ margin: '10px' }}>
      {!subDomain &&
       <FieldGroup
         id="subDomain"
         name="subDomain"
         type="text"
         label="Sub Domain"
         onChange={handleChange}
         onBlur={handleBlur}
         value={values.subDomain}
         error={errors.subDomain}
       />}
      {!domainName &&
       <FieldGroup
         id="domainName"
         name="domainName"
         type="text"
         label="Domain Name"
         onChange={handleChange}
         onBlur={handleBlur}
         value={values.domainName}
         button={
           <Button
             mode="strong"
                   style={{ marginTop: '5px' }}
           onClick={() => {
               UsernameRegistrar.methods.getPrice()
                                   .call()
                                   .then((res) => { setFieldValue('price', fromWei(res)); });
           }}
             >
             Get Price
           </Button>
         }
       />}
      {!domainPrice &&
       <FieldGroup
         id="price"
         name="price"
         label="Domain Price"
         disabled
         value={values.price ? `${formatPrice(values.price)} SNT` : ''} />}
      <Hidden mdDown>
        <FieldGroup
          id="statusAddress"
          name="statusAddress"
          type="text"
          label="Status messenger address domain resolves to"
          onChange={handleChange}
          onBlur={handleBlur}
          value={values.statusAddress}
          error={errors.statusAddress}
          wide="true"
        />
        <FieldGroup
          id="address"
          name="address"
          type="text"
          label="Ethereum address domain resolves to"
          onChange={handleChange}
          onBlur={handleBlur}
          value={values.address}
          error={errors.address}
          button={<Button mode="strong" style={{ padding: '5px 15px 5px 15px', marginTop: '5px' }} onClick={() => setFieldValue('address', web3.eth.defaultAccount)}>Use My Primary Address</Button>}
        />
        {!isSubmitting ? <Button wide mode="strong" type="submit" disabled={isSubmitting || !!Object.keys(errors).length}>{!isSubmitting ? 'Submit' : 'Submitting to the Blockchain - (this may take awhile)'}</Button> : <LinearProgress />}
      </Hidden>
      <Hidden mdUp>
        <Field label="Your Contact Code">
          <MobileSearch
            name="statusAddress"
            style={{ marginTop: '10px' }}
            placeholder="Status Messenger Address"
            value={values.statusAddress}
            onChange={handleChange}
            onClick={() => setFieldValue('statusAddress', '')}
            wide />
        </Field>
        <Field label="Your Wallet Address">
          <MobileSearch
            name="address"
            style={{ marginTop: '10px' }}
            placeholder="Ethereum Address"
            value={values.address}
            onChange={handleChange}
            onClick={() => setFieldValue('address', '')}
            required
            wide />
        </Field>
        <div style={{ position: 'relative', left: 0, right: 0, bottom: 0 }}>
          {!Number(SNTAllowance) || (Number(domainPrice) && !Number(SNTBalance)) ? <TokenPermissions
            symbol="SNT"
            spender={UsernameRegistrar.address}
            methods={TestToken.methods}
            mobile
          />
          : !isSubmitting ? <MobileButton type="submit" text={`${editAccount ? 'Save' : 'Register'} with transaction`} style={{ width: '100%' }} /> : <CircularProgress style={{ marginLeft: '45%' }} />}
        </div>
      </Hidden>
    </div>
  </form>
);

const RegisterSubDomain = withFormik({
  mapPropsToValues: props => ({ subDomain: '', domainName: '', price: '', statusAddress: props.statusContactCode || '', address: web3.eth.defaultAccount || '' }),
  validate(values, props) {
    const errors = {};
    const { address } = values;
    const { subDomain } = props || values;
    if (address && !web3.utils.isAddress(address)) errors.address = 'Not a valid address';
    if (!subDomain) errors.subDomain = 'Required';
    return errors;
  },
  handleSubmit(values, { setSubmitting, props }) {
    const { address, statusAddress } = values;
    const { subDomain, domainName, registeredCallbackFn } = props || values;
    const { methods: { register } } = UsernameRegistrar;
    const { methods: { setAddr, setPubkey } } = PublicResolver;
    const subdomainHash = soliditySha3(subDomain);
    const domainNameHash = hash(domainName);
    const resolveToAddr = address || zeroAddress;
    const points = statusAddress ? generateXY(statusAddress) : null;
    const node = hash(`${subDomain}.${domainName}`);

    const funcsToSend = [];
    const args = [
      subdomainHash,
      resolveToAddr,
      points ? points.x : zeroBytes32,
      points ? points.y : zeroBytes32,
    ];
    props.editAccount
      ? funcsToSend.push(setAddr(node, resolveToAddr), setPubkey(node, args[3], args[4]))
      : funcsToSend.push(register(...args));
    while (funcsToSend.length) {
      const toSend = funcsToSend.pop();
      toSend.estimateGas().then(gasEstimated => {
        console.log("Register would work. :D Gas estimated: "+gasEstimated)
        console.log("Trying: register(\""+subdomainHash+"\",\""+domainNameHash+"\",\""+resolveToAddr+"\",\""+zeroBytes32+"\",\""+zeroBytes32+"\")")
        props.preRegisteredCallback && props.preRegisteredCallback();
        toSend.send({gas: gasEstimated+1000}).then(txId => {
          if(txId.status == "0x1" || txId.status == "0x01"){
            console.log("Register send success. :)")
          } else {
            console.log("Register send errored. :( Out of gas? ")
          }
          console.dir(txId)
        }).catch(err => {
          console.log("Register send errored. :( Out of gas?")
          console.dir(err)
        }).finally(() => {
          // REQUIRED UNTIL THIS ISSUES IS RESOLVED: https://github.com/jaredpalmer/formik/issues/597
          setTimeout(() => { registeredCallbackFn(resolveToAddr, statusAddress || zeroBytes32); }, 200);
          setSubmitting(false);
        });
      }).catch(err => {
        console.log("Register would error. :/ Already Registered? Have Token Balance? Is Allowance set?")
        console.dir(err)
        setSubmitting(false);
      });
    }
  }
})(InnerForm);

const mapStateToProps = state => ({
  statusContactCode: getStatusContactCode(state),
  SNTAllowance: getSNTAllowance(state),
  SNTBalance: getCurrentAccount(state) && getCurrentAccount(state).SNTBalance,
});

export default connect(mapStateToProps)(RegisterSubDomain);
