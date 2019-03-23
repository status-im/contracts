const utils = require("../utils/testUtils")
const { MerkleTree } = require('../utils/merkleTree.js');

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
            resolve(new web3.eth.Contract(Delegation._jsonInterface, receipt.events.InstanceCreated.returnValues.instance));
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
    const initialBalance = 1000000;
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
    const blockEndDelay = 10;
    const tabulationBlockDelay = 10;

    describe("detailed test", function () {           
        var sigs = [];
        var testProposal;
        var blockStart;
        var voteBlockEnd;
        it("create proposal by factory", async function () {
            blockStart = +await web3.eth.getBlockNumber() + 10;
            receipt = await ProposalFactory.methods.createProposal(
                MiniMeToken._address, 
                RootDelegation._address, 
                "0xDA0", 
                tabulationBlockDelay, 
                blockStart, 
                blockEndDelay, 
                QUORUM_QUALIFIED
            ).send()
            testProposal = new web3.eth.Contract(ProposalBase._jsonInterface, receipt.events.InstanceCreated.returnValues.instance);
            
        });
        
        it("rejects signed votes while not voting period ", async function () { 
            assert(await web3.eth.getBlockNumber() < blockStart, "Wrong block number")
            assert.equal(
                await utils.getEVMException(testProposal.methods.voteSigned(utils.zeroBytes32)),
                "Voting not started")
        });

        it("rejects direct votes while not voting period ", async function () { 
            assert(await web3.eth.getBlockNumber() < blockStart, "Wrong block number")
            assert.equal(
                await utils.getEVMException(testProposal.methods.voteDirect(VOTE_APPROVE)),
                "Voting not started")
        });


        it("increases block number to vote block start", async function () {
            await utils.setBlockNumber(blockStart);
            assert(await web3.eth.getBlockNumber() >= blockStart, "Wrong block number")
        }); 


        it("direct vote", async function () { 
            let receipt = await testProposal.methods.voteDirect(VOTE_REJECT).send({from: accounts[5]});
            assert.equal(receipt.events.Voted.returnValues.vote, VOTE_REJECT)
            assert.equal(receipt.events.Voted.returnValues.voter, accounts[5]);
        });   

  

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
            assert.equal(receipt.events.VoteSignatures.returnValues.position, position)
            assert.equal(receipt.events.VoteSignatures.returnValues.merkleTree, merkleRoot);
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

        it("tests under block end", async function () {
            voteBlockEnd = +await testProposal.methods.voteBlockEnd().call();
            assert(await web3.eth.getBlockNumber() <= voteBlockEnd, "Current block number is too low for testing");
        })

        it("reject tabulateDirect when voting not ended", async function () {
            assert.equal(
                await utils.getEVMException(testProposal.methods.tabulateDirect(accounts[5])),
                "Voting not ended")
        }); 

        it("reject tabulateDelegated when voting not ended", async function () {
            assert.equal(
                await utils.getEVMException(testProposal.methods.tabulateDelegated(accounts[0])),
                "Voting not ended")
        }); 

        it("reject tabulateSigned when voting not ended", async function () {
            sig = sigs[0];
            assert.equal(
                await utils.getEVMException(testProposal.methods.tabulateSigned(sig.vote, sig.position, sig.proof, sig.signature)),
                "Voting not ended")
        }); 
        
        it("increases block number to vote block end", async function () {
            await utils.setBlockNumber(+voteBlockEnd+1);
            assert(await web3.eth.getBlockNumber() > voteBlockEnd, "Wrong block number")
        }); 

        it("rejects direct votes when voting period ended", async function () { 
            assert.equal(
                await utils.getEVMException(testProposal.methods.voteDirect(VOTE_APPROVE)),
                "Voting ended")
        });

        it("rejects signed votes when voting period ended", async function () { 
            assert.equal(
                await utils.getEVMException(testProposal.methods.voteSigned(utils.zeroBytes32)),
                "Voting ended")
        });

        it("reject tabulates when no delegate voted", async function () {;
            assert.equal(
                await utils.getEVMException(testProposal.methods.tabulateDelegated(accounts[4])),
                "No delegate vote found")
        }); 

        it("should not have a lastTabulationBlock", async function () {
            assert.equal(await testProposal.methods.lastTabulationBlock().call(), 0); 
        })

        it("rejects finalization when never tabulated", async function () { 
            assert.equal(
                await utils.getEVMException(testProposal.methods.finalize()),
                "Tabulation not started")
        });  

        it("tabulates reject influence from default delegate", async function () { 
            receipt = await tabulateDelegated(testProposal, accounts[3]);
            assert.equal(await web3.eth.getBlockNumber(), await testProposal.methods.lastTabulationBlock().call());
            assert.equal(receipt.events.Claimed.returnValues.vote, VOTE_REJECT)
            assert.equal(receipt.events.Claimed.returnValues.claimer, accounts[5]);
            assert.equal(receipt.events.Claimed.returnValues.source, accounts[3]);
            assert.equal(receipt.events.PartialResult.returnValues.vote, VOTE_REJECT)
            assert.equal(receipt.events.PartialResult.returnValues.total, initialBalance * 1);
        }); 

        it("tabulates reject influence from self voter", async function () {
            
            let receipt = await tabulateDirect(testProposal, accounts[5]);
            assert.equal(await web3.eth.getBlockNumber(), await testProposal.methods.lastTabulationBlock().call());
            assert.equal(receipt.events.Claimed.returnValues.vote, VOTE_REJECT)
            assert.equal(receipt.events.Claimed.returnValues.claimer, accounts[5]);
            assert.equal(receipt.events.Claimed.returnValues.source, accounts[5]);
            assert.equal(receipt.events.PartialResult.returnValues.vote, VOTE_REJECT)
            assert.equal(receipt.events.PartialResult.returnValues.total, initialBalance * 2);
        });   

        it("tabulates approve influence from voteSigned ", async function () { 
            let sig = sigs[2];
            let receipt = await tabulateSigned(testProposal, sig);
            assert.equal(await web3.eth.getBlockNumber(), await testProposal.methods.lastTabulationBlock().call());
            assert.equal(receipt.events.Voted.returnValues.vote, sig.vote, "emit Voted wrong Vote")
            assert.equal(receipt.events.Voted.returnValues.voter, sig.signer, "emit Voted wrong address");
            assert.equal(receipt.events.Claimed.returnValues.vote, sig.vote, "emit Claimed wrong Vote")
            assert.equal(receipt.events.Claimed.returnValues.claimer, sig.signer, "emit Claimed wrong claimer");
            assert.equal(receipt.events.Claimed.returnValues.source, sig.signer, "emit Claimed wrong source");
            assert.equal(receipt.events.PartialResult.returnValues.vote, VOTE_APPROVE)
            assert.equal(receipt.events.PartialResult.returnValues.total, initialBalance * 1);
        });  


        it("should not tabulate for delegate if voted ", async function () { 
            assert.equal(
                await utils.getEVMException(testProposal.methods.tabulateDelegated(accounts[2])),
                "Not delegatable")
            assert.equal(
                await utils.getEVMException(testProposal.methods.tabulateDelegated(accounts[5])),
                "Not delegatable")
        });  

        it("tabulates approve influence from direct delegate", async function () { 
            let receipt = await tabulateDelegated(testProposal, accounts[1]);
            assert.equal(await web3.eth.getBlockNumber(), await testProposal.methods.lastTabulationBlock().call());
            assert.equal(receipt.events.Claimed.returnValues.vote, VOTE_APPROVE)
            assert.equal(receipt.events.Claimed.returnValues.claimer, accounts[2]);
            assert.equal(receipt.events.Claimed.returnValues.source, accounts[1])
            assert.equal(receipt.events.PartialResult.returnValues.vote, VOTE_APPROVE)
            assert.equal(receipt.events.PartialResult.returnValues.total, initialBalance * 2);
        });  

        it("tabulates approve influence from indirect delegate", async function () { 
            let receipt = await tabulateDelegated(testProposal, accounts[0]);
            assert.equal(await web3.eth.getBlockNumber(), await testProposal.methods.lastTabulationBlock().call());
            assert.equal(receipt.events.Claimed.returnValues.vote, VOTE_APPROVE)
            assert.equal(receipt.events.Claimed.returnValues.claimer, accounts[2]);
            assert.equal(receipt.events.Claimed.returnValues.source, accounts[0])
            assert.equal(receipt.events.PartialResult.returnValues.vote, VOTE_APPROVE)
            assert.equal(receipt.events.PartialResult.returnValues.total, initialBalance * 3);
        });    

        it("should not tabulate influence from circular delegation chain when none voted", async function () { 
            assert.equal(
                await utils.getEVMException(testProposal.methods.tabulateDelegated(accounts[7])),
                "revert")
        });    


        it("tabulates approve signature from circular delegation", async function () { 
            receipt = await tabulateSigned(testProposal, sigs[7]);
            assert.equal(await web3.eth.getBlockNumber(), await testProposal.methods.lastTabulationBlock().call());
            assert.equal(receipt.events.PartialResult.returnValues.vote, VOTE_APPROVE)
            assert.equal(receipt.events.PartialResult.returnValues.total, initialBalance * 4);
        })

        it("tabulates approve influence from circular direct delegate", async function () { 
            var receipt = await tabulateDelegated(testProposal, accounts[6]);
            assert.equal(await web3.eth.getBlockNumber(), await testProposal.methods.lastTabulationBlock().call());
            assert.equal(receipt.events.Claimed.returnValues.vote, VOTE_APPROVE)
            assert.equal(receipt.events.Claimed.returnValues.claimer, accounts[7]);
            assert.equal(receipt.events.Claimed.returnValues.source, accounts[6])
            assert.equal(receipt.events.PartialResult.returnValues.vote, VOTE_APPROVE)
            assert.equal(receipt.events.PartialResult.returnValues.total, initialBalance * 5);
        })
        
        it("tabulates approve influence from circular indirect delegate", async function () { 
            receipt = await tabulateDelegated(testProposal, accounts[9]);
            assert.equal(await web3.eth.getBlockNumber(), await testProposal.methods.lastTabulationBlock().call());
            assert.equal(receipt.events.Claimed.returnValues.vote, VOTE_APPROVE)
            assert.equal(receipt.events.Claimed.returnValues.claimer, accounts[7]);
            assert.equal(receipt.events.Claimed.returnValues.source, accounts[9])
            assert.equal(receipt.events.PartialResult.returnValues.vote, VOTE_APPROVE)
            assert.equal(receipt.events.PartialResult.returnValues.total, initialBalance * 6);
        })
        it("tabulates approve influence from circular delegate of claiming delegate", async function () { 
            receipt = await tabulateDelegated(testProposal, accounts[8]);
            assert.equal(await web3.eth.getBlockNumber(), await testProposal.methods.lastTabulationBlock().call());
            assert.equal(receipt.events.Claimed.returnValues.vote, VOTE_APPROVE)
            assert.equal(receipt.events.Claimed.returnValues.claimer, accounts[7]);
            assert.equal(receipt.events.Claimed.returnValues.source, accounts[8])
            assert.equal(receipt.events.PartialResult.returnValues.vote, VOTE_APPROVE)
            assert.equal(receipt.events.PartialResult.returnValues.total, initialBalance * 7);
        })

        it("retabulates approve influence to self vote from delegate claimed reject", async function () {
            sig = sigs[3];
            receipt = await tabulateSigned(testProposal, sig);
            assert.equal(await web3.eth.getBlockNumber(), await testProposal.methods.lastTabulationBlock().call());
            assert.equal(receipt.events.Voted.returnValues.vote, sig.vote, "emit Voted wrong Vote")
            assert.equal(receipt.events.Voted.returnValues.voter, sig.signer, "emit Voted wrong address");
            assert.equal(receipt.events.Claimed.returnValues.vote, sig.vote, "emit Claimed wrong Vote")
            assert.equal(receipt.events.Claimed.returnValues.claimer, sig.signer, "emit Claimed wrong claimer");
            assert.equal(receipt.events.Claimed.returnValues.source, sig.signer, "emit Claimed wrong source");
            assert.equal(receipt.events.PartialResult[0].returnValues.vote, VOTE_REJECT)
            assert.equal(receipt.events.PartialResult[0].returnValues.total, initialBalance * 1);
            assert.equal(receipt.events.PartialResult[1].returnValues.vote, VOTE_APPROVE)
            assert.equal(receipt.events.PartialResult[1].returnValues.total, initialBalance * 8);
        });  

        it("retabulates approve influence to self vote", async function () {
            sig = sigs[6];
            let lastTabulationBlock = await testProposal.methods.lastTabulationBlock().call();
            receipt = await tabulateSigned(testProposal, sig);
            assert.equal(lastTabulationBlock, await testProposal.methods.lastTabulationBlock().call());
            assert.equal(receipt.events.Voted.returnValues.vote, sig.vote, "emit Voted wrong Vote")
            assert.equal(receipt.events.Voted.returnValues.voter, sig.signer, "emit Voted wrong address");
            assert.equal(receipt.events.Claimed.returnValues.vote, sig.vote, "emit Claimed wrong Vote")
            assert.equal(receipt.events.Claimed.returnValues.claimer, sig.signer, "emit Claimed wrong claimer");
            assert.equal(receipt.events.Claimed.returnValues.source, sig.signer, "emit Claimed wrong source");
        });  
        
        it("retabulates approve influence to indirect delegate", async function () { 
            let lastTabulationBlock = await testProposal.methods.lastTabulationBlock().call();
            receipt = await tabulateDelegated(testProposal, accounts[8]);
            assert.equal(lastTabulationBlock, await testProposal.methods.lastTabulationBlock().call());
            assert.equal(receipt.events.Claimed.returnValues.vote, VOTE_APPROVE)
            assert.equal(receipt.events.Claimed.returnValues.claimer, accounts[6]);
            assert.equal(receipt.events.Claimed.returnValues.source, accounts[8])
        });    

        it("retabulates approve influence to direct delegate", async function () {
            let lastTabulationBlock = await testProposal.methods.lastTabulationBlock().call();
            receipt = await tabulateDelegated(testProposal, accounts[9]);
            assert.equal(lastTabulationBlock, await testProposal.methods.lastTabulationBlock().call());
            assert.equal(receipt.events.Claimed.returnValues.vote, VOTE_APPROVE)
            assert.equal(receipt.events.Claimed.returnValues.claimer, accounts[6]);
        });    
        
        it("rejects finalization before tabulation end", async function () { 
            let lastTabulationBlock = await testProposal.methods.lastTabulationBlock().call();
            assert(await web3.eth.getBlockNumber() < +lastTabulationBlock+tabulationBlockDelay, "Wrong block number")
            assert.equal(
                await utils.getEVMException(testProposal.methods.finalize()),
                "Tabulation not ended"
            )
        }); 

        it("rejects clear before finalization", async function () { 
            assert.equal(
                await utils.getEVMException(testProposal.methods.clear()),
                "Not finalized")
        }); 

        it("increses block to tabulation end", async function (){
            await utils.increaseBlock(+tabulationBlockDelay+1);
            let lastTabulationBlock = await testProposal.methods.lastTabulationBlock().call();
            assert(await web3.eth.getBlockNumber() > +lastTabulationBlock+tabulationBlockDelay, "Wrong block number")
        });

        it("finalizes after tabulation end", async function (){
            receipt = await testProposal.methods.finalize().send({from: web3.eth.defaultAccount});
            assert.equal(receipt.events.FinalResult.returnValues.result, VOTE_APPROVE)
        });


        it("reject tabulateDirect after finalization", async function () {
            assert.equal(
                await utils.getEVMException(testProposal.methods.tabulateDirect(accounts[5])),
                "Tabulation ended"
            )
        }); 

        it("reject tabulateDelegated after finalization", async function () {
            assert.equal(
                await utils.getEVMException(testProposal.methods.tabulateDelegated(accounts[0])),
                "Tabulation ended"
            )
        }); 

        it("reject tabulateSigned after finalization", async function () {
            sig = sigs[0];
            assert.equal(
                await utils.getEVMException(testProposal.methods.tabulateSigned(sig.vote, sig.position, sig.proof, sig.signature)),
                "Tabulation ended"
            )
        }); 

        it("rejects finalization after finalization", async function () { 
            assert.equal(
                await utils.getEVMException(testProposal.methods.finalize()),
                "Already finalized")
        }); 

        it("clear after finalization", async function () { 
            await testProposal.methods.clear().send({from: web3.eth.defaultAccount});
        }); 
    });

    describe("test qualified quorum reject", function() {
        var sigs = [];
        var testProposal;
        var blockStart;
        var voteBlockEnd;
        it("create proposal by factory", async function () {
            blockStart = await web3.eth.getBlockNumber();
            
            receipt = await ProposalFactory.methods.createProposal(
                MiniMeToken._address, 
                ChildDelegation._address, 
                "0xDA0", 
                tabulationBlockDelay, 
                blockStart, 
                blockEndDelay, 
                QUORUM_QUALIFIED
            ).send()
            testProposal = new web3.eth.Contract(ProposalBase._jsonInterface, receipt.events.InstanceCreated.returnValues.instance);
        });

        it("include approve votes", async function () { 
            sigs = []
            let vote = VOTE_APPROVE;
            let approveHash = await testProposal.methods.getVoteHash(vote).call();
            let signatures = await Promise.all(accounts.slice(0,5).map((address) => {
                //in web app should web3.eth.personal.sign(approveHash, address)
                return web3.eth.sign(approveHash, address);    
            }))
            let merkleTree = new MerkleTree(signatures);    
            let merkleRoot = merkleTree.getHexRoot();
            
            let receipt = await testProposal.methods.voteSigned(merkleRoot).send({from: accounts[0]})
            let position = receipt.events.VoteSignatures.returnValues.position;
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

        it("include reject votes", async function () { 
            let vote = VOTE_REJECT;
            let approveHash = await testProposal.methods.getVoteHash(vote).call();
            let signatures = await Promise.all(accounts.slice(5).map((address) => {
                //in web app should web3.eth.personal.sign(approveHash, address)
                return web3.eth.sign(approveHash, address);    
            }))
            let merkleTree = new MerkleTree(signatures);    
            let merkleRoot = merkleTree.getHexRoot();
            
            let receipt = await testProposal.methods.voteSigned(merkleRoot).send({from: accounts[0]})
            let position = receipt.events.VoteSignatures.returnValues.position;
            for(var i = 0; i < signatures.length; i++) {
                sigs.push ({ 
                    position: position, 
                    vote: vote,
                    signature: signatures[i],
                    proof: merkleTree.getHexProof(signatures[i]),
                    signer: accounts[5+i]
                })
                
            }
        });
        
        it("increases block number to vote block end", async function () {
            voteBlockEnd = await testProposal.methods.voteBlockEnd().call();
            await utils.setBlockNumber(+voteBlockEnd+1);
            assert(await web3.eth.getBlockNumber() > voteBlockEnd, "Wrong block number")
        }); 

        it("tabulates the votes", async function () { 
            await Promise.all(sigs.map((sig) => {
                return tabulateSigned(testProposal, sig);    
            }))
        });

        it("increses block to tabulation end", async function (){
            await utils.increaseBlock(+tabulationBlockDelay+1);
            let lastTabulationBlock = await testProposal.methods.lastTabulationBlock().call();
            assert(await web3.eth.getBlockNumber() > +lastTabulationBlock+tabulationBlockDelay, "Wrong block number")
        });

        it("finalizes after tabulation end", async function (){
            receipt = await testProposal.methods.finalize().send({from: web3.eth.defaultAccount});
            assert.equal(receipt.events.FinalResult.returnValues.result, VOTE_REJECT)
        });

        it("clear after finalization", async function () { 
            await testProposal.methods.clear().send({from: web3.eth.defaultAccount});
        }); 
    })

    describe("test simple quorum reject", function() {
        var sigs = [];
        var testProposal;
        var blockStart;
        var voteBlockEnd;
        it("create proposal by factory", async function () {
            blockStart = await web3.eth.getBlockNumber();
            
            receipt = await ProposalFactory.methods.createProposal(
                MiniMeToken._address, 
                ChildDelegation._address, 
                "0xDA0", 
                tabulationBlockDelay, 
                blockStart, 
                blockEndDelay, 
                QUORUM_SIMPLE
            ).send()
            testProposal = new web3.eth.Contract(ProposalBase._jsonInterface, receipt.events.InstanceCreated.returnValues.instance);
        });

        it("include approve votes", async function () { 
            sigs = []
            let vote = VOTE_APPROVE;
            let approveHash = await testProposal.methods.getVoteHash(vote).call();
            let signatures = await Promise.all(accounts.slice(0,5).map((address) => {
                //in web app should web3.eth.personal.sign(approveHash, address)
                return web3.eth.sign(approveHash, address);    
            }))
            let merkleTree = new MerkleTree(signatures);    
            let merkleRoot = merkleTree.getHexRoot();
            
            let receipt = await testProposal.methods.voteSigned(merkleRoot).send({from: accounts[0]})
            let position = receipt.events.VoteSignatures.returnValues.position;
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

        it("include reject votes", async function () { 
            let vote = VOTE_REJECT;
            let approveHash = await testProposal.methods.getVoteHash(vote).call();
            let signatures = await Promise.all(accounts.slice(5).map((address) => {
                //in web app should web3.eth.personal.sign(approveHash, address)
                return web3.eth.sign(approveHash, address);    
            }))
            let merkleTree = new MerkleTree(signatures);    
            let merkleRoot = merkleTree.getHexRoot();
            
            let receipt = await testProposal.methods.voteSigned(merkleRoot).send({from: accounts[0]})
            let position = receipt.events.VoteSignatures.returnValues.position;
            for(var i = 0; i < signatures.length; i++) {
                sigs.push ({ 
                    position: position, 
                    vote: vote,
                    signature: signatures[i],
                    proof: merkleTree.getHexProof(signatures[i]),
                    signer: accounts[5+i]
                })
                
            }
        });
        
        it("increases block number to vote block end", async function () {
            voteBlockEnd = await testProposal.methods.voteBlockEnd().call();
            await utils.setBlockNumber(+voteBlockEnd+1);
            assert(await web3.eth.getBlockNumber() > voteBlockEnd, "Wrong block number")
        }); 

        it("tabulates the votes", async function () { 
            await Promise.all(sigs.map((sig) => {
                return tabulateSigned(testProposal, sig);    
            }))
        });

        it("increses block to tabulation end", async function (){
            await utils.increaseBlock(+tabulationBlockDelay+1);
            let lastTabulationBlock = await testProposal.methods.lastTabulationBlock().call();
            assert(await web3.eth.getBlockNumber() > +lastTabulationBlock+tabulationBlockDelay, "Wrong block number")
        });

        it("finalizes after tabulation end", async function (){
            receipt = await testProposal.methods.finalize().send({from: web3.eth.defaultAccount});
            assert.equal(receipt.events.FinalResult.returnValues.result, VOTE_REJECT)
        });

        it("clear after finalization", async function () { 
            await testProposal.methods.clear().send({from: web3.eth.defaultAccount});
        }); 
    })

    describe("test simple quorum approve", function() {
        var sigs = [];
        var testProposal;
        var blockStart;
        var voteBlockEnd;
        it("create proposal by factory", async function () {
            blockStart = await web3.eth.getBlockNumber();
            
            receipt = await ProposalFactory.methods.createProposal(
                MiniMeToken._address, 
                ChildDelegation._address, 
                "0xDA0", 
                tabulationBlockDelay, 
                blockStart, 
                blockEndDelay, 
                QUORUM_SIMPLE
            ).send()
            testProposal = new web3.eth.Contract(ProposalBase._jsonInterface, receipt.events.InstanceCreated.returnValues.instance);
        });

        it("include approve votes", async function () { 
            sigs = []
            let vote = VOTE_APPROVE;
            let approveHash = await testProposal.methods.getVoteHash(vote).call();
            let signatures = await Promise.all(accounts.slice(0,6).map((address) => {
                //in web app should web3.eth.personal.sign(approveHash, address)
                return web3.eth.sign(approveHash, address);    
            }))
            let merkleTree = new MerkleTree(signatures);    
            let merkleRoot = merkleTree.getHexRoot();
            
            let receipt = await testProposal.methods.voteSigned(merkleRoot).send({from: accounts[0]})
            let position = receipt.events.VoteSignatures.returnValues.position;
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

        it("include reject votes", async function () { 
            let vote = VOTE_REJECT;
            let approveHash = await testProposal.methods.getVoteHash(vote).call();
            let signatures = await Promise.all(accounts.slice(6).map((address) => {
                //in web app should web3.eth.personal.sign(approveHash, address)
                return web3.eth.sign(approveHash, address);    
            }))
            let merkleTree = new MerkleTree(signatures);    
            let merkleRoot = merkleTree.getHexRoot();
            
            let receipt = await testProposal.methods.voteSigned(merkleRoot).send({from: accounts[0]})
            let position = receipt.events.VoteSignatures.returnValues.position;
            for(var i = 0; i < signatures.length; i++) {
                sigs.push ({ 
                    position: position, 
                    vote: vote,
                    signature: signatures[i],
                    proof: merkleTree.getHexProof(signatures[i]),
                    signer: accounts[6+i]
                })
                
            }
        });
        
        it("increases block number to vote block end", async function () {
            voteBlockEnd = await testProposal.methods.voteBlockEnd().call();
            await utils.setBlockNumber(+voteBlockEnd+1);
            assert(await web3.eth.getBlockNumber() > voteBlockEnd, "Wrong block number")
        }); 

        it("tabulates the votes", async function () { 
            await Promise.all(sigs.map((sig) => {
                return tabulateSigned(testProposal, sig);    
            }))
        });

        it("increses block to tabulation end", async function (){
            await utils.increaseBlock(+tabulationBlockDelay+1);
            let lastTabulationBlock = await testProposal.methods.lastTabulationBlock().call();
            assert(await web3.eth.getBlockNumber() > +lastTabulationBlock+tabulationBlockDelay, "Wrong block number")
        });

        it("finalizes after tabulation end", async function (){
            receipt = await testProposal.methods.finalize().send({from: web3.eth.defaultAccount});
            assert.equal(receipt.events.FinalResult.returnValues.result, VOTE_APPROVE)
        });

        it("clear after finalization", async function () { 
            await testProposal.methods.clear().send({from: web3.eth.defaultAccount});
        }); 
    }) 
    
})