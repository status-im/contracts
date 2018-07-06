import React from 'react';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

const styles = theme => ({
  button: {
    margin: theme.spacing.unit,
    borderRadius: '4px',
    backgroundColor: 'rgb(67, 96, 223, 0.1)',
  }
});

const buttonText = { color: '#4360df', margin: '0 20px', fontWeight: 300 }

const Welcome = ({ classes }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <Typography variant="title" style={{ textAlign: 'center' }}>
      Get a human-readable name instead of long addresses
    </Typography>
    <Button size="large" className={classNames(classes.button)}>
      <div style={buttonText}>Let's Go</div>
    </Button>
  </div>
);

export default withStyles(styles)(Welcome);
