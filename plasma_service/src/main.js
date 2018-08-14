
// TODO: Client should be able to:
// - deposit their coins (can use simple web3)
// - transfer their coins in the side chains (using loomjs)
// - exit their coins (using web3)
// - challenge 


// TODO: Authority must
// - submit blocks
// - finalize exits
// - Maybe a relay service for watching exits for other accoutns can be performed?


import express from 'express';
import bodyParser from 'body-parser';

import config from './config';

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));

router.get('/', (req, res) => {
    res.status(200).send({ 'test': true});
    // TODO: implement functions that can be helpful for clients
})



const app = express();
const port = process.env.PORT || 3000;
app.use('/', router);
const server = app.listen(port, () => {
    console.log('Server listening on port ' + port);
});



