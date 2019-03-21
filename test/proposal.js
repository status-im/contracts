const utils = require("../utils/testUtils")


const DefaultDelegation = require('Embark/contracts/DefaultDelegation');
const DelegationFactory = require('Embark/contracts/DelegationFactory');
const MiniMeToken = require('Embark/contracts/MiniMeToken');
const Delegation = require('Embark/contracts/Delegation');
const ProposalFactory = require('Embark/contracts/ProposalFactory');
const Proposal = require('Embark/contracts/Proposal');
const ProposalBase = require('Embark/contracts/ProposalBase');

config({
    contracts: {
        "MiniMeTokenFactory": {
        },
        "MiniMeToken": {
            "args": [
                "$MiniMeTokenFactory",
                utils.zeroAddress,
                0,
                "TestMiniMeToken",
                18,
                "TST",
                true
            ]
        },
        "DefaultDelegation": {
            "args": [ "$accounts[5]" ]
        },
        "DelegationBase": {
            "args": [ utils.zeroAddress ]
        },
        "DelegationInit": {},
        "DelegationFactory": {
            "args": ["$DelegationBase", "$DelegationInit", utils.zeroAddress]
        },
        "ProposalBase": {},
        "ProposalInit": {},
        "ProposalFactory": {
            "args": ["$ProposalBase", "$ProposalInit", utils.zeroAddress]
        }

      }
  });
function mintTokens(accounts, amount) {
    return Promise.all(
        accounts.map((account) => {
            return MiniMeToken.methods.generateTokens(account, amount).send({from: accounts[0]});
        })
    );
}

function newDelegation(topDelegation) {
    return new Promise((resolve, reject) => {
        DelegationFactory.methods.createDelegation(topDelegation).send().on('receipt', (receipt) => {
            resolve(new web3.eth.Contract(Delegation._jsonInterface, receipt.events.InstanceCreated.returnValues[0]));
        }).on('error', (error) => {
            reject(error);
        });
    });
    
}

async function addGas(call, from, amount=21000) {
    return call.send({
        gas: await call.estimateGas({gas: 8000000})+amount,
        from: from
    });
}

async function tabulateDirect(proposal, account) {
    return addGas(proposal.methods.tabulateDirect(account), web3.eth.defaultAccount);
}

async function tabulateDelegated(proposal, account) {
    return addGas(proposal.methods.tabulateDelegated(account), web3.eth.defaultAccount);
}

async function tabulateSigned(proposal, sig) {
    return addGas(
        proposal.methods.tabulateSigned(
            sig.vote,
            sig.position,
            sig.proof,
            sig.signature
        ),
        web3.eth.defaultAccount
    );
}


contract("Proposal", function() {
    this.timeout(0);
    const initialBalance = 17 * 10 ^ 18;
    var defaultDelegate;
    var accounts;
    var RootDelegation;
    var ChildDelegation;

    before(function(done) {
        defaultDelegate = DefaultDelegation._address;
        web3.eth.getAccounts().then((res) => {
            web3.eth.defaultAccount = res[0]
            accounts = res;
            //let contactList = require("./contacts.json")
            //contacts = Object.keys(contactList).map((key) => { return { name: contactList[key].name.en, address: utils.pubKeyToAddress(key), pubKey: key }})
            //res = accounts.concat(contacts.map((obj) => {return obj.address } ));
            mintTokens(res, initialBalance).then((mintReceipts) => {
                newDelegation(defaultDelegate).then((createdRoot) => {
                    RootDelegation = createdRoot;
                    newDelegation(RootDelegation._address).then((createdChild) => {
                        ChildDelegation = createdChild;
                        Promise.all([ 
                            // root: 0 -> 1 -> 2 -> 3 (-> 5) 
                            RootDelegation.methods.delegate(accounts[1]).send({from: accounts[0]}),
                            RootDelegation.methods.delegate(accounts[2]).send({from: accounts[1]}),
                            RootDelegation.methods.delegate(accounts[3]).send({from: accounts[2]}),
                            // root: 4 -> 4
                            RootDelegation.methods.delegate(accounts[4]).send({from: accounts[4]}),

                            // root: 6 -> 7 -> 8 -> 9 -> 6 (circular)
                            RootDelegation.methods.delegate(accounts[7]).send({from: accounts[6]}),
                            RootDelegation.methods.delegate(accounts[8]).send({from: accounts[7]}),
                            RootDelegation.methods.delegate(accounts[9]).send({from: accounts[8]}),
                            RootDelegation.methods.delegate(accounts[6]).send({from: accounts[9]}),
                            // child: 5 -> 6
                            ChildDelegation.methods.delegate(accounts[7]).send({from: accounts[5]})
                        ]).then((delegateReceipts) => {
                            done();
                        })
                    })
                })
            });
        }); 
    });

    const QUORUM_QUALIFIED = 0;
    const QUORUM_MAJORITY = 1;
    const QUORUM_SIMPLE = 2;

    const VOTE_NULL = 0;
    const VOTE_REJECT = 1;
    const VOTE_APPROVE = 2;

    var testProposal;
    var blockStart 
    it("create proposal by factory", async function () {
        let tabulationBlockDelay = 50;
        blockStart = await web3.eth.getBlockNumber() + 10;
        let blockEndDelay = 10;
        receipt = await ProposalFactory.methods.createProposal(
            MiniMeToken._address, 
            RootDelegation._address, 
            "0xDA0", 
            tabulationBlockDelay, 
            blockStart, 
            blockEndDelay, 
            QUORUM_QUALIFIED
        ).send()
        testProposal = new web3.eth.Contract(ProposalBase._jsonInterface, receipt.events.InstanceCreated.returnValues[0]);
        
    });
    
    it("rejects signed and direct votes while not voting period ", async function () { 
        assert(await web3.eth.getBlockNumber() < blockStart, "Wrong block number")
        assert(await utils.assertEVMException(testProposal.methods.voteDirect(VOTE_APPROVE).send({from: accounts[0]}), "Voting not started"), "Didnt rejected")
        assert(await utils.assertEVMException(testProposal.methods.voteSigned(utils.zeroBytes32).send({from: accounts[0]}), "Voting not started"), "Didnt rejected")
    });


    it("increases block number to vote block start", async function () {
        await utils.setBlockNumber(blockStart);
        assert(await web3.eth.getBlockNumber() >= blockStart, "Wrong block number")
    }); 


    it("direct vote", async function () { 
        let receipt = await testProposal.methods.voteDirect(VOTE_APPROVE).send({from: accounts[5]});
        assert.equal(receipt.events.Voted.returnValues[0], VOTE_APPROVE)
        assert.equal(receipt.events.Voted.returnValues[1], accounts[5]);
    });   

    const { MerkleTree } = require('../utils/merkleTree.js');
    var sigs = [];


    it("signed vote at voting period", async function () { 
        let vote = VOTE_APPROVE;
        let approveHash = await testProposal.methods.getVoteHash(vote).call();
        let signatures = await Promise.all(accounts.map((address) => {
            //in web app should web3.eth.personal.sign(approveHash, address)
            return web3.eth.sign(approveHash, address);    
        }))
        let merkleTree = new MerkleTree(signatures);    
        let merkleRoot = merkleTree.getHexRoot();
        
        let receipt = await testProposal.methods.voteSigned(merkleRoot).send({from: accounts[0]})
        let position = 0;
        assert.equal(receipt.events.VoteSignatures.returnValues[0], position)
        assert.equal(receipt.events.VoteSignatures.returnValues[1], merkleRoot);
        for(var i = 0; i < signatures.length; i++) {
            sigs.push ({ 
                position: position, 
                vote: vote,
                signature: signatures[i],
                proof: merkleTree.getHexProof(signatures[i]),
                signer: accounts[i]
            })
            
        }
    });    
    var voteBlockEnd;
    it("tests under block end", async function () {
        voteBlockEnd = await testProposal.methods.voteBlockEnd().call();
        assert(await web3.eth.getBlockNumber() <= voteBlockEnd, "Current block number is too low for testing");
    })

    it("reject tabulateDirect when voting not ended", async function () {
        assert(await utils.assertEVMException(tabulateDirect(testProposal, accounts[5]), "Block end not reached"), "Didnt rejected")
    }); 

    it("reject tabulateDelegated when voting not ended", async function () {
        assert(await utils.assertEVMException(tabulateDelegated(testProposal, accounts[0]), "Block end not reached"), "Didnt rejected")
    }); 

    it("reject tabulateSigned when voting not ended", async function () {
        assert(await utils.assertEVMException(tabulateSigned(testProposal, sigs[0]), "Block end not reached"), "Didnt rejected")
    }); 
    
    it("increases block number to vote block end", async function () {
        await utils.setBlockNumber(voteBlockEnd+1);
        assert(await web3.eth.getBlockNumber() > voteBlockEnd, "Wrong block number")
    }); 

    it("rejects direct votes when voting period ended", async function () { 
        assert(await utils.assertEVMException(testProposal.methods.voteDirect(VOTE_APPROVE).send({from: accounts[1]}), "Voting ended"), "Didnt rejected")
    });

    it("rejects signed votes when voting period ended", async function () { 
        assert(await utils.assertEVMException(testProposal.methods.voteSigned(utils.zeroBytes32).send({from: accounts[0]}), "Voting ended"), "Didnt rejected")
    });

    it("reject tabulates when no delegate voted", async function () {;
        assert(await utils.assertEVMException(tabulateDelegated(testProposal, accounts[4]), "No delegate vote found"), "Didnt rejected 2")
    }); 

    
    it("tabulates influence from self voter", async function () {
        let receipt = await tabulateDirect(testProposal, accounts[5]);
        assert.equal(receipt.events.Claimed.returnValues[0], VOTE_APPROVE)
        assert.equal(receipt.events.Claimed.returnValues[1], accounts[5]);
        assert.equal(receipt.events.Claimed.returnValues[2], accounts[5]);

    });    

    it("tabulates influence from default delegate", async function () { 
        receipt = await tabulateDelegated(testProposal, accounts[3]);
        assert.equal(receipt.events.Claimed.returnValues[0], VOTE_APPROVE)
        assert.equal(receipt.events.Claimed.returnValues[1], accounts[5]);
        assert.equal(receipt.events.Claimed.returnValues[2], accounts[3]);

    });    

    it("tabulates influence from voteSigned ", async function () { 
        let sig = sigs[2];
        let receipt = await tabulateSigned(testProposal, sig);
        assert.equal(receipt.events.Voted.returnValues[0], sig.vote, "emit Voted wrong Vote")
        assert.equal(receipt.events.Voted.returnValues[1], sig.signer, "emit Voted wrong address");
        assert.equal(receipt.events.Claimed.returnValues[0], sig.vote, "emit Claimed wrong Vote")
        assert.equal(receipt.events.Claimed.returnValues[1], sig.signer, "emit Claimed wrong claimer");
        assert.equal(receipt.events.Claimed.returnValues[2], sig.signer, "emit Claimed wrong source");
    });  


    it("should not tabulate for delegate if voted ", async function () { 
        assert(await utils.assertEVMException(tabulateDelegated(testProposal, accounts[2]), "Not delegatable"), "Didnt rejected ")
        assert(await utils.assertEVMException(tabulateDelegated(testProposal, accounts[5]), "Not delegatable"), "Didnt rejected 2")
    });  

    it("tabulates influence from direct delegate ", async function () { 
        let receipt = await tabulateDelegated(testProposal, accounts[1]);
        assert.equal(receipt.events.Claimed.returnValues[0], VOTE_APPROVE)
        assert.equal(receipt.events.Claimed.returnValues[1], accounts[2]);
        assert.equal(receipt.events.Claimed.returnValues[2], accounts[1])
    });  

    it("tabulates influence from indirect delegate", async function () { 
        let receipt = await tabulateDelegated(testProposal, accounts[0]);
        assert.equal(receipt.events.Claimed.returnValues[0], VOTE_APPROVE)
        assert.equal(receipt.events.Claimed.returnValues[1], accounts[2]);
        assert.equal(receipt.events.Claimed.returnValues[2], accounts[0])
    });    

    it("should not tabulate influence from circular delegation chain when none voted", async function () { 
        assert(await utils.assertEVMException(tabulateDelegated(testProposal, accounts[7]), "revert"), "Didnt rejected ")
    });    


    it("tabulates signature from circular delegation", async function () { 
        await tabulateSigned(testProposal, sigs[7]);
    })

    it("tabulates influence from circular direct delegate", async function () { 
        var receipt = await tabulateDelegated(testProposal, accounts[6]);
        assert.equal(receipt.events.Claimed.returnValues[0], VOTE_APPROVE)
        assert.equal(receipt.events.Claimed.returnValues[1], accounts[7]);
        assert.equal(receipt.events.Claimed.returnValues[2], accounts[6])
    })
    
    it("tabulates influence from circular indirect delegate", async function () { 
        receipt = await tabulateDelegated(testProposal, accounts[9]);
        assert.equal(receipt.events.Claimed.returnValues[0], VOTE_APPROVE)
        assert.equal(receipt.events.Claimed.returnValues[1], accounts[7]);
        assert.equal(receipt.events.Claimed.returnValues[2], accounts[9])
    })
    it("tabulates influence from circular delegate of claiming delegate", async function () { 
        receipt = await tabulateDelegated(testProposal, accounts[8]);
        assert.equal(receipt.events.Claimed.returnValues[0], VOTE_APPROVE)
        assert.equal(receipt.events.Claimed.returnValues[1], accounts[7]);
        assert.equal(receipt.events.Claimed.returnValues[2], accounts[8])
    })

    it("retabulates influence to self vote", async function () {
        sig = sigs[6];
        receipt = await tabulateSigned(testProposal, sig);
        assert.equal(receipt.events.Voted.returnValues[0], sig.vote, "emit Voted wrong Vote")
        assert.equal(receipt.events.Voted.returnValues[1], sig.signer, "emit Voted wrong address");
        assert.equal(receipt.events.Claimed.returnValues[0], sig.vote, "emit Claimed wrong Vote")
        assert.equal(receipt.events.Claimed.returnValues[1], sig.signer, "emit Claimed wrong claimer");
        assert.equal(receipt.events.Claimed.returnValues[2], sig.signer, "emit Claimed wrong source");
    
    });  
    
    it("retabulates influence to indirect delegate", async function () { 
        receipt = await tabulateDelegated(testProposal, accounts[8]);
        assert.equal(receipt.events.Claimed.returnValues[0], VOTE_APPROVE)
        assert.equal(receipt.events.Claimed.returnValues[1], accounts[6]);
        assert.equal(receipt.events.Claimed.returnValues[2], accounts[8])
    });    

    it("retabulates influence to direct delegate", async function () {
        receipt = await tabulateDelegated(testProposal, accounts[9]);
        assert.equal(receipt.events.Claimed.returnValues[0], VOTE_APPROVE)
        assert.equal(receipt.events.Claimed.returnValues[1], accounts[6]);
        assert.equal(receipt.events.Claimed.returnValues[2], accounts[9])
    });    
      
    it("create proposal by factory", async function () {
        let tabulationBlockDelay = 50;
        blockStart = await web3.eth.getBlockNumber();
        let blockEndDelay = 10;
        receipt = await ProposalFactory.methods.createProposal(
            MiniMeToken._address, 
            ChildDelegation._address, 
            "0xDA0", 
            tabulationBlockDelay, 
            blockStart, 
            blockEndDelay, 
            QUORUM_QUALIFIED
        ).send()
        testProposal = new web3.eth.Contract(ProposalBase._jsonInterface, receipt.events.InstanceCreated.returnValues[0]);
    });

    it("child delegation default parent chain break", async function () { 
        
    });    
    it("child delegation indirect parent chain break", async function () { 

    });    
    it("child delegation parent chain full break", async function () { 

    });    




    
})