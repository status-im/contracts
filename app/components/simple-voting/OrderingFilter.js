import React, { Fragment, PureComponent } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import ListItemText from '@material-ui/core/ListItemText';
import ListItem from '@material-ui/core/ListItem';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';
import Checkbox from '@material-ui/core/Checkbox';
import { VotingContext } from '../../context';

export const constants = { MOST_VOTES: 'Most Votes', MOST_VOTERS: 'Most Voters', NEWEST_ADDED: 'Newest Added', ENDING_SOONEST: 'Ending Soonest' };
const styles = {
  appBar: {
    position: 'relative',
  },
  flex: {
    flex: 1,
  },
};

function Transition(props) {
  return <Slide direction="up" {...props} />;
}

const ListButton = ({ name, setPollOrder, selected, handleClose }) => (
  <Fragment>
    <ListItem button onClick={() => {
        setPollOrder(name);
        handleClose();
    }}>
      <Checkbox
        checked={selected}
        color="primary"
        disableRipple
      />
      <ListItemText primary={constants[name]} />
    </ListItem>
    <Divider />
  </Fragment>
)

class OrderingDialog extends PureComponent {
  state = {
    open: false,
  };

  handleClickOpen = () => {
    this.setState({ open: true });
  };

  handleClose = () => {
    this.setState({ open: false });
  };

  render() {
    const { classes } = this.props;
    const { handleClose } = this;
    return (
      <VotingContext.Consumer>
        {({ setPollOrder, pollOrder }) =>
          <div>
            <Button color="inherit" variant="outlined" onClick={this.handleClickOpen}>Open Filters</Button>
            <Dialog
              fullScreen
              open={this.state.open}
              onClose={this.handleClose}
              TransitionComponent={Transition}
            >
              <AppBar className={classes.appBar}>
                <Toolbar>
                  <IconButton color="inherit" onClick={this.handleClose} aria-label="Close">
                    <CloseIcon />
                  </IconButton>
                  <Typography variant="title" color="inherit" className={classes.flex}>
                    close
                  </Typography>
                </Toolbar>
              </AppBar>
              <List>
                {Object.keys(constants).map((name, i) => <ListButton key={i} name={name} setPollOrder={setPollOrder} selected={pollOrder === name} handleClose={handleClose} />)}
              </List>
            </Dialog>
          </div>
        }
      </VotingContext.Consumer>
    );
  }
}

OrderingDialog.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(OrderingDialog);
