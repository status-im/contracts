import React, { Fragment, PureComponent } from 'react';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/lab/Slider';
import PollManager from 'Embark/contracts/PollManager';
import MiniMeTokenInterface from 'Embark/contracts/MiniMeTokenInterface';
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
  }
};

const sortingFn = {
  MOST_VOTES: (a, b) => b._qvResults - a._qvResults,
  MOST_VOTERS: (a, b) => b._voters - a._voters,
  NEWEST_ADDED: (a, b) => b._startBlock - a._startBlock,
  ENDING_SOONEST: (a, b) => a._endBlock - b._endBlock
};
class Poll extends PureComponent {

  constructor(props){
    super(props);
    this.state = { value: 0, balance: 0, isSubmitting: false };
  }

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

    const balance4Voting = toWei(value * value);
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
            this.getBalance();
            this.setState({isSubmitting: false});
          });
  }

  componentDidMount() {
    this.getBalance();
    this.getVote();
  }

  getBalance() {
    const { fromWei } = web3.utils;
    const { appendToPoll, idPoll } = this.props;
    MiniMeTokenInterface.options.address = this.props._token;
    MiniMeTokenInterface.methods.balanceOfAt(web3.eth.defaultAccount, this.props._startBlock - 1)
                        .call()
                        .then(balance => {
                          appendToPoll(idPoll, {balance: fromWei(balance)})
                        });
  }

  getVote() {
    const { fromWei } = web3.utils;
    const { idPoll } = this.props;
    PollManager.methods.getVote(idPoll, web3.eth.defaultAccount)
               .call()
               .then(vote => {
                 const value = parseInt(Math.sqrt(fromWei(vote)));
                 this.setState({ value, originalValue: value });
               })
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
      classes
    } = this.props;
    const { value, originalValue, isSubmitting, error } = this.state;
    const cantVote = balance == 0 || !_canVote;
    const disableVote = cantVote || isSubmitting;
    const { fromWei } = web3.utils;
    const maxValue = Math.floor(Math.sqrt(balance));
    const buttonText = originalValue != 0 && value != originalValue ? 'Change Vote' : 'Vote';
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
            {balance == 0 && <span>You can not vote because your account had no SNT when this poll was created</span>}
            {balance != 0 && !_canVote && <span>You can not vote on this poll</span>}
          </Typography>}
          {error && <Typography variant="body2" color="error">{error}</Typography>}
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
    {({ updatePoll, rawPolls, pollOrder, appendToPoll }) =>
      <Fragment>
        {rawPolls
          .map((poll, i) => ({ ...poll, idPoll: i }) )
          .sort(sortingFn[pollOrder])
          .map((poll) => <Poll key={poll._token} classes={classes} appendToPoll={appendToPoll} updatePoll={updatePoll} {...poll} />)}
      </Fragment>
    }
  </VotingContext.Consumer>
)

export default withStyles(styles)(PollsList);
