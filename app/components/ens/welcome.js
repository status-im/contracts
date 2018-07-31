import React from 'react';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import StatusCards from '../../ui/icons/svg/intro_cards.svg';

const styles = theme => ({
  button: {
    margin: theme.spacing.unit,
    borderRadius: '4px',
    backgroundColor: 'rgba(67, 96, 223, 0.1)',
  }
});

const textStyle = { textAlign: 'center' };
const sectionTitleStyle = { margin: '10px 0px 10px 0px' };
const subTextStyle = { color: '#939ba1' };
const buttonText = { color: '#4360df', margin: '0 20px', fontWeight: 300 };

const WelcomeContent = () => (
  <div style={{ marginTop: '20px', textAlign: 'center' }}>
    <div>
      <Typography variant="title" style={sectionTitleStyle}>
        Deposit 100 SNT to reserve
      </Typography>
      <Typography variant="subheading" style={subTextStyle}>
        After a year, renew your name or release it and get your SNT back.
      </Typography>
    </div>
    <div>
      <Typography variant="title" style={sectionTitleStyle}>
        Attach wallet & contact code
      </Typography>
      <Typography variant="subheading" style={subTextStyle}>
        Your long, complex wallet address and contact code become a single, easy-to-remember username.
      </Typography>
    </div>
    <div>
      <Typography variant="title" style={sectionTitleStyle}>
        Connect & get paid
      </Typography>
      <Typography variant="subheading" style={subTextStyle}>
        Share your username to chat on Status or receive payments from anywhere.
      </Typography>
    </div>
  </div>
);

const Welcome = ({ classes, toggleSearch }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '16px' }}>
    <img src={StatusCards} />
    <Typography variant="title" style={textStyle}>
      Get a personal domain name to replace those crazy-long codes
    </Typography>
    <Button size="large" className={classNames(classes.button)} onClick={toggleSearch}>
      <div style={buttonText}>Let's Go</div>
    </Button>
    <WelcomeContent />
  </div>
);

export default withStyles(styles)(Welcome);
