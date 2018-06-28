import React, { Fragment, Component } from 'react';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/lab/Slider';
import Tooltip from '@material-ui/core/Tooltip';
import PollManager from 'Embark/contracts/PollManager';

class Poll extends Component {

  constructor(props){
    super(props);

    this.state = { value: 0, isSubmitting: false, ...props };
  }

  handleChange = (event, value) => {
    this.setState({ value });
  };

  handleClick = (event) => {
    event.preventDefault();

    this.setState({isSubmitting: true});

    const { customVote, poll } = PollManager.methods;
    const { idPoll, value } = this.state;
    const balance4Voting = value * value;

    const toSend = customVote(idPoll, balance4Voting);
    
    toSend.estimateGas()
      .then(gasEstimated => {
        console.log("customVote gas estimated: " + gasEstimated);
        return toSend.send({gas: gasEstimated + 1000});
      })
      .then(res => {
        console.log('sucess:', res);
        this.setState({isSubmitting: false});
        return poll(idPoll).call();
      })
      .then(poll => {
        this.setState(poll);
      })
      .catch(res => {
        console.log('fail:', res);
      })
      .finally(() => {
        this.setState({isSubmitting: false});
      });
  }

  render(){
    const { _description,
            _totalCensus,
            _voters,
            _qvResults,
            _results, 
            _canVote, 
            value, 
            isSubmitting } = this.state;

    const disableVote = !_canVote || isSubmitting;

    const tokenBalance = 100; // TODO: read balance from cloned token

    const maxValue = Math.floor(Math.sqrt(tokenBalance));

    


    return (
      <Card>
        <CardContent>
          <Typography variant="headline">Proposal: {_description}</Typography>
          <Typography variant="subheading" color="textSecondary">
            Number of voters: {_voters}
          </Typography>
          <Typography variant="subheading" color="textSecondary">
            Votes: {_qvResults}
          </Typography>
          <Typography variant="subheading" color="textSecondary">
            SNT Allocated: {_results}
          </Typography>
        </CardContent>
        <Tooltip id="tooltip-icon" placement="top" title={`${value} votes`}>
        <CardActions>
            <Slider value={value} min={0} max={maxValue} step={1} onChange={this.handleChange} />
            <Button variant="contained" disabled={disableVote}  color="primary" onClick={this.handleClick}>Vote</Button>
        </CardActions>
          </Tooltip>
      </Card>
    )
  }
}


const PollsList = ({ rawPolls  }) => (
  <Fragment>
    {rawPolls.map((poll, idx) => <Poll key={idx} idPoll={idx} {...poll} />)}
  </Fragment>
)

export default PollsList
