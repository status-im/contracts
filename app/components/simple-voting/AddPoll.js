import React, { Fragment } from 'react';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import PollManager from 'Embark/contracts/PollManager';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
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
          label="description"
          className={classes.textField}
          value={values.description}
          onChange={handleChange}
          margin="normal"
          fullWidth
          error={errors.description}
        />
        <Button type="submit" variant="extendedFab" aria-label="add" className={classes.button}>Submit</Button>
      </form>
    </CardContent>
  </Card>
)

const StyledForm = withStyles(styles)(InnerForm);
const AddPoll = withFormik({
  mapPropsToValues: props => ({ description: ''}),
  validate(values){
    const errors = {};
    return errors;
  },
  async handleSubmit(values, { setSubmitting }) {
    const { description } = values;
    const { eth: { getBlockNumber }, utils: { asciiToHex } } = window.web3;
    const { addPoll } = PollManager.methods;
    const currentBlock = await getBlockNumber();
    const endTime = currentBlock + (oneDayinBlocks * 90);
    addPoll(
      endTime,
      asciiToHex(description)
    )
      .send()
      .then(res => {
        console.log('sucess:', res);
      })
      .catch(res => {
        console.log('fail:', res);
      })
  }
})(StyledForm)

export default AddPoll;
