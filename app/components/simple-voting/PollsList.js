import React, { Fragment } from 'react';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

const Poll = ({ _question, _totalCensus, _voters }) => (
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
  </Card>
)

const PollsList = ({ rawPolls  }) => (
  <Fragment>
    {rawPolls.map(poll => <Poll {...poll} />)}
  </Fragment>
)

export default PollsList
