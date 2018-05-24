const utils = require("../utils/testUtils.js")

// TODO: This a very minimal set of tests purely for understanding the contract. I think they can be used though.
describe("DelegationProxy", async function() {
    this.timeout(0);
    //Initialize global/common contracts for all tests
    let accounts = [];

    let delegationProxy = []
    let delegateTo = [[],[]]
    let delegationOf = [[],[]]
    let delegatedInfluence = [[],[]]
    let influence = [[],[]]

    let tokensBalance;

    before(function(done) {
        var contractsConfig = {
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
            "DelegationProxy": {
                "args": [ 0 ]
            },
            "ChildDelegationProxy": {
                "instanceOf": "DelegationProxy",
                "args": [
                    "$DelegationProxy"
                ]
            }

          };
          EmbarkSpec.deployAll(contractsConfig, async function(accountsArr) { 
            accounts = accountsArr
            delegationProxy[0] = DelegationProxy
            delegationProxy[1] = ChildDelegationProxy 
            delegateTo = [
                [
                    accounts[1],
                    accounts[2],
                    0x0
                ],
                [
                    0x0,
                    accounts[2],
                    0x0
                ]
            ]
            delegationOf = [
                [
                    accounts[2], 
                    accounts[2], 
                    accounts[2]
                ],
                [
                    accounts[0], 
                    accounts[2], 
                    accounts[2]
                ]
            ]
        
            delegatedInfluence = [
                [0, 1, 2],
                [0, 0, 1]
            ]
            
            influence = [
                [0, 0, 3], 
                [1, 0, 2]
            ]
        
            tokensBalance = 1000
        
            for(i=0;i<accounts.length;i++){
                await MiniMeToken.methods.generateTokens(accounts[i], tokensBalance).send({from: accounts[0]})
            }
            done() 
          });
    })

    it("creates Delegate Log event", async function () {
        const i = 0
        const j = 0
        let result = await delegationProxy[i].methods.delegate(delegateTo[i][j]).send({from: accounts[j]})
        const delegateArgs = result.events.Delegate.returnValues;
        assert.equal(delegateArgs.who, accounts[j], "["+i+","+j+"] Delegate Log shows delegating from isn't sender. " + delegateArgs.who + " != " + accounts[j])
        assert.equal(delegateArgs.to, delegateTo[i][j], "["+i+","+j+"]Delegate Log shows delegating to isn't passed address")
    
    })

    it("updates delegations mapping with new delegate", async function () {
        const i = 0
        const j = 0
        let result = await delegationProxy[i].methods.delegate(delegateTo[i][j]).send({from: accounts[j]})
        let delegations = await delegationProxy[i].methods.delegations(accounts[j], 1).call()
        assert.equal(delegations[0], result.blockNumber, "["+i+","+j+"] Delegations block number is incorrect. " + delegations[0] + ' != ' +  result.blockNumber)
        assert.equal(delegations[1], delegateTo[i][j], "["+i+","+j+"] Delegations to account is incorrect")
    })

    it("stores delegation checkpoints correctly", async function () {
        const delegateTo2 = [
            [
                0x0,
                accounts[0],
                accounts[0]
            ],
            [
                accounts[2],
                0x0,
                accounts[1]
            ]
        ]

        const delegationOf2 = [
            [
                accounts[0], 
                accounts[0], 
                accounts[0]
            ],
            [
                accounts[1], 
                accounts[1], 
                accounts[1]
            ]
        ]

        const delegateTo3 = [
            [
                0x0,
                0x0,
                0x0
            ],
            [
                0x0,
                0x0,
                0x0
            ]
        ]

        const delegationOf3 = [
            [
                accounts[0], 
                accounts[1], 
                accounts[2]
            ],
            [
                accounts[0], 
                accounts[1], 
                accounts[2]
            ]
        ]

        for (var i = 0; i < delegateTo.length; i++) {
            for (var j = 0; j < delegateTo[i].length; j++) {
                await delegationProxy[i].methods.delegate(delegateTo[i][j]).send({from: accounts[j]});
            }                    
        }
        const blockn1 = await web3.eth.getBlockNumber()
        
        for (var i = 0; i < delegateTo2.length; i++) {
            for (var j = 0; j < delegateTo2[i].length; j++) {
                await delegationProxy[i].methods.delegate(delegateTo2[i][j]).send({from: accounts[j]});                        
            }                    
        }
        const blockn2 = await web3.eth.getBlockNumber()

        for (var i = 0; i < delegateTo3.length; i++) {
            for (var j = 0; j < delegateTo3[i].length; j++) {
                await delegationProxy[i].methods.delegate(delegateTo3[i][j]).send({from: accounts[j]});     
            }                    
        }
        const blockn3 = await web3.eth.getBlockNumber()

        for (var i = 0; i < delegateTo.length; i++) {
            for (var j = 0; j < delegateTo[i].length; j++) {        
                assert.equal(
                    await delegationProxy[i].methods.delegatedToAt(accounts[j], blockn1).call(), 
                    delegateTo[i][j], 
                    "["+i+","+j+"] +"+delegationProxy[i].address+".delegatedToAt("+accounts[j]+", +"+blockn1+") is incorrect")
                assert.equal(
                    await delegationProxy[i].methods.delegatedToAt(accounts[j], blockn2).call(), 
                    delegateTo2[i][j], 
                    "["+i+","+j+"] +"+delegationProxy[i].address+".delegatedToAt("+accounts[j]+", +"+blockn2+") is incorrect")
                assert.equal(
                    await delegationProxy[i].methods.delegatedToAt(accounts[j], blockn3).call(), 
                    delegateTo3[i][j], 
                    "["+i+","+j+"] +"+delegationProxy[i].address+".delegatedToAt("+accounts[j]+", +"+blockn3+") is incorrect")

                assert.equal(
                    await delegationProxy[i].methods.delegationOfAt(accounts[j], blockn1).call(), 
                    delegationOf[i][j], 
                    "["+i+","+j+"] +"+delegationProxy[i].address+".delegationOfAt("+accounts[j]+", +"+blockn1+") is incorrect")
                assert.equal(
                    await delegationProxy[i].methods.delegationOfAt(accounts[j], blockn2).call(), 
                    delegationOf2[i][j], 
                    "["+i+","+j+"] +"+delegationProxy[i].address+".delegationOfAt("+accounts[j]+", +"+blockn2+") is incorrect")
                assert.equal(
                    await delegationProxy[i].methods.delegationOfAt(accounts[j], blockn3).call(), 
                    delegationOf3[i][j], 
                    "["+i+","+j+"] +"+delegationProxy[i].address+".delegationOfAt("+accounts[j]+", +"+blockn3+") is incorrect")
            }                    
        }

    })

    it("delegates back to parentProxy", async function () {
        for (var i = 0; i < delegateTo.length; i++) {
            for (var j = 0; j < delegateTo[i].length; j++) {
                await delegationProxy[i].methods.delegate(delegateTo[i][j]).send({from: accounts[j]});
            }                    
        }
        const blockn1 = await web3.eth.getBlockNumber()

        for (var j = 0; j < delegateTo[1].length; j++) {
            await delegationProxy[1].delegate(delegationProxy[0].address).send({from: accounts[j]});
        }
        
        const blockn2 = await web3.eth.getBlockNumber()

        for (var j = 0; j < delegateTo[1].length; j++) {        
            assert.equal(
                await delegationProxy[1].delegatedToAt(accounts[j], blockn1).call(), 
                delegateTo[1][j], 
                "["+j+"] +"+delegationProxy[1].address+".delegatedToAt("+accounts[j]+", +"+blockn1+") is incorrect")
            assert.equal(
                await delegationProxy[1].delegatedToAt(accounts[j], blockn2).call(), 
                delegateTo[0][j], 
                "["+j+"] +"+delegationProxy[1].address+".delegatedToAt("+accounts[j]+", +"+blockn2+") is incorrect")

            assert.equal(
                await delegationProxy[1].delegationOfAt(accounts[j], blockn1).call(), 
                delegationOf[1][j], 
                "["+j+"] +"+delegationProxy[1].address+".delegationOfAt("+accounts[j]+", +"+blockn1+") is incorrect")
            assert.equal(
                await delegationProxy[1].delegationOfAt(accounts[j], blockn2).call(), 
                delegationOf[0][j], 
                "["+j+"] +"+delegationProxy[1].address+".delegationOfAt("+accounts[j]+", +"+blockn2+") is incorrect")
            
        }                    
    })

    it("returns correctly delegated to address", async function () {
        let delegatedTo 
        for (var i = 0; i < delegateTo.length; i++) {
            for (var j = 0; j < delegateTo[i].length; j++) {
                await delegationProxy[i].methods.delegate(delegateTo[i][j]).send({from: accounts[j]});
                let bn = await web3.eth.getBlockNumber();
                delegatedTo = await delegationProxy[i].methods.delegatedToAt(accounts[j], bn)    
                assert.equal(
                    delegatedTo, 
                    delegateTo[i][j], 
                    "["+i+","+j+"] +"+delegationProxy[i].address+".delegatedToAt("+accounts[j]+", +"+bn+") is incorrect")
                
            }                    
        }
    })
    
    it("returns correctly delegation endpoints of address", async function () {
        let result = [[],[]]
        for (var i = 0; i < delegateTo.length; i++) {
            for (var j = 0; j < delegateTo[i].length; j++) {
                await delegationProxy[i].methods.delegate(delegateTo[i][j]).send({from: accounts[j]});       
            }
            let bn = await web3.eth.getBlockNumber();
            for (j = 0; j < delegateTo[i].length; j++) {
                assert.equal(
                    await delegationProxy[i].methods.delegationOfAt(accounts[j], bn).call(), 
                    delegationOf[i][j], 
                    "["+i+","+j+"] +"+delegationProxy[i].address+".delegationOfAt("+accounts[j]+", +"+bn+") is incorrect"
                )
            }                    
        }   
    })

    it("returns expected amount of influence delegated from", async function () {
        
        for (var i = 0; i < delegationProxy.length; i++) {
            for (var j = 0; j < delegateTo[i].length; j++) {
                await delegationProxy[i].methods.delegate(delegateTo[i][j]).send({from: accounts[j]});    
            }
            let bn = await web3.eth.getBlockNumber();
            for (var j = 0; j < delegatedInfluence[i].length; j++) {
                assert.equal(
                    delegatedInfluence[i][j] * tokensBalance, 
                    await delegationProxy[i].methods.delegatedInfluenceFromAt(accounts[j], MiniMeToken.address, bn).call(),
                    "["+i+","+j+"] +"+delegationProxy[i].address+".delegatedInfluenceFrom("+accounts[j]+", +"+bn+") is not as expected"
                )    
            }                    
        }
    })

    it("returns expected influence", async function () {
        
        for (var i = 0; i < influence.length; i++) {
            for (var j = 0; j < delegateTo[i].length; j++) {
                await delegationProxy[i].methods.delegate(delegateTo[i][j]).send({from: accounts[j]});    
            }
            let bn = await web3.eth.getBlockNumber();
            for (var j = 0; j < influence[i].length; j++) {
                let result = await delegationProxy[i].methods.influenceOfAt(accounts[j], MiniMeToken.address, bn).call();
                assert.equal(
                    influence[i][j] * tokensBalance, 
                    result,
                    "["+i+","+j+"] +"+delegationProxy[i].address+".influenceOfAt("+accounts[j]+", +"+bn+") is not as expected. "+influence[i][j] * tokensBalance+" != "+ result)
            }                    
        }
    })
    

})