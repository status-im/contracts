const utils = require('../utils/testUtils')
const assert = require('assert');
const SingleChoice = require('Embark/contracts/SingleChoice');
const BN = web3.utils.BN;
var _ = require('lodash');
var rlp = require('rlp');

config({
  contracts: {
    "MiniMeTokenFactory": {
        "gasLimit": 4000000
    },
    "MiniMeToken": {
        "deploy": false,
    },
    "SNT":{
        "instanceOf": "MiniMeToken",
        "args": [
            "$MiniMeTokenFactory",
            utils.zeroAddress,
            0,
            "TestMiniMeToken",
            18,
            "TST",
            true
        ],
        "gasLimit": 4000000
    },
    "SingleChoiceFactory": {
        "deploy": false
    },
    "PollManager": {
        "deploy": true,
        "args": ["$MiniMeTokenFactory", "$SNT"]
    }
  }
});

singleChoiceDef = (question, options) => {
    var d = [
        new Buffer(question),
        _.map(options, function(o) {
            return new Buffer(o);
        })
    ];

    var b= rlp.encode(d);
    var rlpDefinition =  '0x' + b.toString('hex');

    return rlpDefinition;
}

describe("VotingDapp", function () {
    this.timeout(0);

    let accounts;
    
    before(function(done) {
        
        web3.eth.getAccounts().then((acc) => { 
            accounts = acc; 
            return SNT.methods.generateTokens(accounts[0], 6).send()
        }).then((receipt) => { 
            return SNT.methods.generateTokens(accounts[1], 12).send()
        }).then((receipt) => { 
            return SNT.methods.generateTokens(accounts[2], 10).send()
        }).then((receipt) => { 
            return SNT.methods.generateTokens(accounts[3], 7).send()
        }).then((receipt) => {
            done(); 
        });
    });

    it("Test", async () => {

        const blockNumber = await web3.eth.getBlockNumber();
        const question =  singleChoiceDef("Move from Slack to Status Desktop", [ "Yes", "No" ]);
        let receipt;
        

        // ===================================================
        // Creating a proposal without holding SNT SHOULD FAIL!
        try {
            receipt = await PollManager.methods.addPoll(
                blockNumber,
                blockNumber + 10, 
                question)
                .send({from: accounts[8]});
            assert.fail('should have reverted before');
        } catch(error) {
            utils.assertJump(error);
        }
        
        
        // ===================================================
        // Creating a proposal as a SNT holder
        
        receipt = await PollManager.methods.addPoll(
                                blockNumber,
                                blockNumber + 10, 
                                question)
                                .send({from: accounts[0]});

        assert.equal(!!receipt.events.PollCreated, true, "PollCreated not triggered");

        const pollId = receipt.events.PollCreated.returnValues.idPoll;
        let poll = await PollManager.methods.poll(pollId).call();
        
        SingleChoice.options.address = poll._pollContract;
        const pollContract = SingleChoice; 
        
        // Options are represented as a hex value
        const Yes = await SingleChoice.methods.getBallot(0).call();
        const No = await SingleChoice.methods.getBallot(1).call();
      

        // ===================================================
        // Determining if I can vote por a proposal
        let canVote = await PollManager.methods.canVote(pollId).call({from: accounts[0]});
        assert.equal(canVote, true, "User should be able to vote");


        // ===================================================
        // Voting
        receipt = await PollManager.methods.vote(pollId, Yes).send({from: accounts[0]});
        assert.equal(!!receipt.events.Vote, true, "Vote not triggered");
        

        // ===================================================
        // Getting what option the voter selected
        let myVote = await PollManager.methods.getVote(pollId, accounts[0]).call();
        assert.equal(myVote._ballot, Yes, "Vote is different from selected");


        // ===================================================
        // Voting when you're not a SNT holder SHOULD FAIL!
        try {
            receipt = await PollManager.methods.vote(pollId, Yes)
                            .send({from: accounts[8]});
            assert.fail('should have reverted before');
        } catch(error) {
            utils.assertJump(error);
        }


        // ===================================================
        // Getting proposal information
        poll = await PollManager.methods.poll(pollId).call();
        let votersByBallotYES = await PollManager.methods.getVotesByBallot(pollId, Yes).call();
        let tokenVotesByBallotYES = await pollContract.methods.result(0).call(); // 0 == Yes (because it is the initial option )
        let quadraticVotesByBallotYES = await pollContract.methods.qvResult(0).call(); // 0 == Yes (because it is the initial option )

        // Will contain state of the poll
        // console.dir(poll);

        // Contains how many votes has a ballot
        // console.log(tokenVotesByBallotYES); 

        // Contains how many votes has a ballot using quadratic voting
        //console.log(quadraticVotesByBallotYES);

        // Contains how many voters voted for that option
        // console.log(votersByBallotYES); 

        // ===================================================
        // Unvote
        receipt = await PollManager.methods.unvote(pollId).send({from: accounts[0]});
        assert.equal(!!receipt.events.Unvote, true, "Unvote not triggered");

    });

});

