import React, { Fragment, PureComponent } from 'react';
import { toString } from 'lodash';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import Slide from '@material-ui/core/Slide';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/lab/Slider';
import PollManager from 'Embark/contracts/PollManager';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import web3 from "Embark/web3"
import CircularProgress from '@material-ui/core/CircularProgress';
import { withStyles } from '@material-ui/core/styles';
import { VotingContext } from '../../context';

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  thumb: {
    width: '24px',
    height: '24px'
  },
  appBar: {
    position: 'relative',
  },
  flex: {
    flex: 1,
  },
};
function Transition(props) {
  return <Slide direction="up" {...props} />;
};

const getIdeaFromStr = str => {
  const match = str.match(/\(([^)]+)\)/)
  if (match) return match[1].toLowerCase();
  return match;
}
const sortingFn = {
  MOST_VOTES: (a, b) => b._qvResults - a._qvResults,
  MOST_VOTERS: (a, b) => b._voters - a._voters,
  NEWEST_ADDED: (a, b) => b._startBlock - a._startBlock,
  ENDING_SOONEST: (a, b) => a._endBlock - b._endBlock
};
class Poll extends PureComponent {

  constructor(props){
    super(props);
    this.state = { value: props.votes, originalValue: props.votes, balance: 0, isSubmitting: false, open: false };
  }

  handleClickOpen = () => {
    this.setState({ open: true });
  };

  handleClose = () => {
    this.setState({ open: false });
  };

  handleChange = (event, value) => {
    this.setState({ value })
  };

  handleClick = (event) => {
    event.preventDefault();

    this.setState({isSubmitting: true});

    const { customVote, poll, unvote } = PollManager.methods;
    const { updatePoll, idPoll } = this.props;
    const { value } = this.state;
    const { toWei } = web3.utils;

    const balance4Voting = toWei(toString(value * value));
    const toSend = balance4Voting == 0 ? unvote(idPoll) : customVote(idPoll, balance4Voting);

    toSend.estimateGas()
          .then(gasEstimated => {
            console.log("voting gas estimated: " + gasEstimated);
            return toSend.send({gas: gasEstimated + 100000});
          })
          .then(res => {
            console.log('sucess:', res);
            this.setState({ isSubmitting: false, originalValue: value });
            return updatePoll(idPoll);
          })
          .catch(res => {
            console.log('fail:', res, res.messsage);
            this.setState({ error: res.message })
          })
          .finally(() => {
            this.setState({isSubmitting: false});
          });
  }

  render(){
    const {
      _description,
      _totalCensus,
      _voters,
      _qvResults,
      _results,
      _canVote,
      balance,
      classes,
      ideaSites
    } = this.props;
    const { value, originalValue, isSubmitting, error } = this.state;
    const cantVote = balance == 0 || !_canVote;
    const disableVote = cantVote || isSubmitting;
    const { fromWei } = web3.utils;
    const maxValue = Math.floor(Math.sqrt(balance));
    const buttonText = originalValue != 0 && value != originalValue ? 'Change Vote' : 'Vote';
    const idea = getIdeaFromStr(_description)
    const ideaSite = ideaSites && ideaSites.filter(site => site.includes(idea));
    return (
      <Card>
        <CardContent>
          <Typography variant="headline">{_description}</Typography>
          <Typography variant="subheading" color="textSecondary">
            <b>Total:</b> {_voters} voters. {_qvResults} votes ({fromWei(_results)} SNT)
          </Typography>
          <Typography variant="subheading" color="textSecondary">
            <b>Your vote:</b> {value} votes ({value * value} SNT)
          </Typography>
          {cantVote && <Typography variant="body2" color="error">
            {balance == 0 && <span>Voting disabled for proposals made when there was no SNT in the account</span>}
            {balance != 0 && !_canVote && <span>You can not vote on this poll</span>}
          </Typography>}
          {error && <Typography variant="body2" color="error">{error}</Typography>}
          {ideaSite && ideaSite.length > 0 && <Typography onClick={this.handleClickOpen} variant="subheading" color="primary">{ideaSite}</Typography>}
          {ideaSite && <Dialog
                         fullScreen
                         open={this.state.open}
                         onClose={this.handleClose}
                         TransitionComponent={Transition}
                       >
            <AppBar className={classes.appBar} onClick={this.handleClose}>
              <Toolbar>
                <IconButton color="inherit" aria-label="Close">
                  <CloseIcon />
                </IconButton>
                <Typography variant="title" color="inherit" className={classes.flex}>
                  close
                </Typography>
              </Toolbar>
            </AppBar>
            <div
              style={{ overflow: "auto", height: '100%', width: '100%', position: "fixed", top: 0, left: 0, zIndex: 1, overflowScrolling: "touch", WebkitOverflowScrolling: "touch" }}
            >
              <iframe
                className="contentIframe"
                frameBorder="0"
                src={ideaSite[0]}
                style={{ height: "100%", width: "100%" }}
                height="100%"
                width="100%"
              >
              </iframe>
            </div>
          </Dialog>}
        </CardContent>
        {!cantVote && <CardActions className={classes.card}>
          <Slider style={{ width: '95%' }} classes={{ thumb: classes.thumb }} disabled={disableVote} value={value || 0} min={0} max={maxValue} step={1} onChange={this.handleChange} />
          {isSubmitting ? <CircularProgress /> : <Button variant="contained" disabled={disableVote}  color="primary" onClick={this.handleClick}>{buttonText}</Button>}
        </CardActions>}
      </Card>
    )
  }
}


const PollsList = ({ classes }) => (
  <VotingContext.Consumer>
    {({ updatePoll, rawPolls, pollOrder, appendToPoll, ideaSites }) =>
      <Fragment>
        {rawPolls
          .sort(sortingFn[pollOrder])
          .map((poll) => <Poll key={poll._token} classes={classes} appendToPoll={appendToPoll} updatePoll={updatePoll} ideaSites={ideaSites} {...poll} />)}
      </Fragment>
    }
  </VotingContext.Consumer>
)

export default withStyles(styles)(PollsList);
