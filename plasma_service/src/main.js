import express from 'express';
import bodyParser from 'body-parser';

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));

router.get('/', (req, res) => {
    res.status(200).send({ 'test': true});
})

const app = express();
const port = process.env.PORT || 3000;

app.use('/', router);

const server = app.listen(port, () => {
    console.log('Server listening on port ' + port);
});