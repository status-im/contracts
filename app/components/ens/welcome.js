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
    backgroundColor: 'rgb(67, 96, 223, 0.1)',
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
        Secure
      </Typography>
      <Typography variant="subheading" style={subTextStyle}>
        Search for vacant names in domains .stateofus.eth and .eth
      </Typography>
    </div>
    <div>
      <Typography variant="title" style={sectionTitleStyle}>
        Decentralized
      </Typography>
      <Typography variant="subheading" style={subTextStyle}>
        Search for vacant names in domains .stateofus.eth and .eth
      </Typography>
    </div>
    <div>
      <Typography variant="title" style={sectionTitleStyle}>
        Amazing
      </Typography>
      <Typography variant="subheading" style={subTextStyle}>
        Search for vacant names in domains .stateofus.eth and .eth
      </Typography>
    </div>
  </div>
);

const Welcome = ({ classes, toggleSearch }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <img src={StatusCards} />
    <Typography variant="title" style={textStyle}>
      Get a human-readable name instead of long addresses
    </Typography>
    <Button size="large" className={classNames(classes.button)} onClick={toggleSearch}>
      <div style={buttonText}>Let's Go</div>
    </Button>
    <WelcomeContent />
  </div>
);

export default withStyles(styles)(Welcome);
