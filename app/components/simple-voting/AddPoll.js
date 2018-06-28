import React, { Fragment } from 'react';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import PollManager from 'Embark/contracts/PollManager';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import { withStyles } from '@material-ui/core/styles';
import { withFormik } from 'formik';

const oneDayinBlocks = 5760;

const styles = theme => ({
  button: {
    margin: theme.spacing.unit,
  },
  extendedIcon: {
    marginRight: theme.spacing.unit,
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit
  },
  inputLabel: {
    fontSize: '16px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column'
  },
  textFieldInput: {
    fontSize: '16px'
  },
  textFieldFormLabel: {
    fontSize: 18,
  }
});

const InnerForm = ({
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  handleSubmit,
  isSubmitting,
  classes
}) => (
  <Card>
    <CardContent>
      <form onSubmit={handleSubmit} className={classes.form}>
        <TextField
          id="description"
          label="Enter your proposal description"
          className={classes.textField}
          value={values.description}
          onChange={handleChange}
          margin="normal"
          fullWidth
          error={!!errors.description}
          InputProps={{
            classes: {
              input: classes.textFieldInput
            },
          }}
          InputLabelProps={{
            className: classes.textFieldFormLabel
          }}
          helperText={errors.description}
        />
        {!isSubmitting ?
         <Button type="submit" variant="extendedFab" aria-label="add" className={classes.button}>Submit</Button> :
         <CircularProgress style={{ margin: '10px 10px 10px 50%' }} />
        }
      </form>
    </CardContent>
  </Card>
)

const StyledForm = withStyles(styles)(InnerForm);
const AddPoll = withFormik({
  mapPropsToValues: props => ({ description: ''}),
  validate(values, props){
    const errors = {};
    const { description } = values;
    if(description.toString().trim() === "") errors.description = true;
    return errors;
  },
  async handleSubmit(values, { setSubmitting, setErrors, props }) {
    const { description } = values;
    const { eth: { getBlockNumber }, utils: { asciiToHex } } = window.web3;
    const { addPoll } = PollManager.methods;
    const currentBlock = await getBlockNumber();
    const endTime = currentBlock + (oneDayinBlocks * 90);
    const toSend = addPoll(endTime, description);

    setSubmitting(true);

    toSend.estimateGas()
          .then(gasEstimated => {
            console.log("addPoll gas estimated: "+gasEstimated);
            return toSend.send({gas: gasEstimated + 100000});
          })
          .then(res => {
            console.log('sucess:', res);
            setSubmitting(false);
            props.togglePoll();
          })
          .catch(res => {
            console.log('fail:', res);
            setErrors({ 'description': res.message.split('Error:').pop().trim() });
          })
          .finally(() => {
            setSubmitting(false);
          });
  }
})(StyledForm)

export default AddPoll;
