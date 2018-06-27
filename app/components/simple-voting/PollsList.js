import React, { Fragment, PureComponent } from 'react';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/lab/Slider';
import Tooltip from '@material-ui/core/Tooltip';

class Poll extends PureComponent {
  state = {
    value: 0,
  };

  handleChange = (event, value) => {
    this.setState({ value });
  };

  render(){
    const { _question, _totalCensus, _voters } = this.props;
    const { value } = this.state;
    return (
      <Card>
        <CardContent>
          <Typography variant="headline">Proposal: {_question}</Typography>
          <Typography variant="subheading" color="textSecondary">
            Total SNT Voted: {_totalCensus}
          </Typography>
          <Typography variant="subheading" color="textSecondary">
            Number of voters: {_voters}
          </Typography>
        </CardContent>
        <Tooltip id="tooltip-icon" placement="top" title={`${value * value} SNT`}>
        <CardActions>
            <Slider value={value} min={0} max={6} step={1} onChange={this.handleChange} />
            <Button variant="contained" color="primary">Vote</Button>
        </CardActions>
          </Tooltip>
      </Card>
    )
  }
}

const PollsList = ({ rawPolls  }) => (
  <Fragment>
    {rawPolls.map((poll, idx) => <Poll key={idx} {...poll} />)}
  </Fragment>
)

export default PollsList
