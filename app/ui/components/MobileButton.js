import React, { Fragment } from 'react';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';

const styles = theme => ({
  button: {
    borderRadius: '4px',
    backgroundColor: 'rgba(67, 96, 223, 0.1)',
  }
});
const buttonText = { color: '#4360df', margin: '0 20px', fontWeight: 300 };
const MobileButton = ({ classes, text, type, style, ...props }) => (
  <Fragment>
    <Button type={type} size="large" className={classNames(classes.button)} style={style} {...props} >
      <div style={buttonText}>{text}</div>
    </Button>
  </Fragment>
);

export default withStyles(styles)(MobileButton);
