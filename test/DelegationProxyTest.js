const DelegationProxy = artifacts.require("DelegationProxy.sol")
const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory.sol")
const MiniMeToken = artifacts.require("MiniMeToken.sol")
const TestUtils = require("./TestUtils.js")

// TODO: This a very minimal set of tests purely for understanding the contract. I think they can be used though.
contract("DelegationProxy", accounts => {

    //Initialize global/common contracts for all tests
    let delegationProxy = []
    const delegateTo = [
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
    const delegationOf = [
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

    const delegatedInfluence = [
        [0, 1, 2],
        [0, 0, 1]
    ]
    
    const influence = [
        [0, 0, 3], 
        [1, 0, 2]
    ]

    beforeEach(async () => {
        delegationProxy[0] = await DelegationProxy.new(0)
        delegationProxy[1] = await DelegationProxy.new(delegationProxy[0].address)
    })

    describe("delegate(address _to)", () => {
        
        it("creates Delegate Log event", async () => {
            const i = 0
            const j = 0
            delegationProxy[i].delegate(delegateTo[i][j], {from: accounts[j]})
            const delegateArgs = await TestUtils.listenForEvent(delegationProxy[i].Delegate())
            assert.equal(delegateArgs.who, accounts[j], "["+i+","+j+"] Delegate Log shows delegating from isn't sender")
            assert.equal(delegateArgs.to, delegateTo[i][j], "["+i+","+j+"]Delegate Log shows delegating to isn't passed address")
        
        })

        it("updates delegations mapping with new delegate", async () => {
            const i = 0
            const j = 0
            await delegationProxy[i].delegate(delegateTo[i][j], {from: accounts[j]})
            const delegations = await delegationProxy[i].delegations.call(accounts[j], 0)
            assert.equal(delegations[0].c, web3.eth.blockNumber, "["+i+","+j+"] Delegations block number is incorrect")
            assert.equal(delegations[1], delegateTo[i][j], "["+i+","+j+"] Delegations to account is incorrect")
        })

        it("stores delegation checkpoints correctly", async () => {
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
                    await delegationProxy[i].delegate(delegateTo[i][j], {from: accounts[j]});
                }                    
            }
            const blockn1 = web3.eth.blockNumber
            
            for (var i = 0; i < delegateTo2.length; i++) {
                for (var j = 0; j < delegateTo2[i].length; j++) {
                    await delegationProxy[i].delegate(delegateTo2[i][j], {from: accounts[j]});                        
                }                    
            }
            const blockn2 = web3.eth.blockNumber

            for (var i = 0; i < delegateTo3.length; i++) {
                for (var j = 0; j < delegateTo3[i].length; j++) {
                    await delegationProxy[i].delegate(delegateTo3[i][j], {from: accounts[j]});     
                }                    
            }
            const blockn3 = web3.eth.blockNumber

            for (var i = 0; i < delegateTo.length; i++) {
                for (var j = 0; j < delegateTo[i].length; j++) {        
                    assert.equal(
                        await delegationProxy[i].delegatedToAt(accounts[j], blockn1), 
                        delegateTo[i][j], 
                        "["+i+","+j+"] +"+delegationProxy[i].address+".delegatedToAt("+accounts[j]+", +"+blockn1+") is incorrect")
                    assert.equal(
                        await delegationProxy[i].delegatedToAt(accounts[j], blockn2), 
                        delegateTo2[i][j], 
                        "["+i+","+j+"] +"+delegationProxy[i].address+".delegatedToAt("+accounts[j]+", +"+blockn2+") is incorrect")
                    assert.equal(
                        await delegationProxy[i].delegatedToAt(accounts[j], blockn3), 
                        delegateTo3[i][j], 
                        "["+i+","+j+"] +"+delegationProxy[i].address+".delegatedToAt("+accounts[j]+", +"+blockn3+") is incorrect")

                    assert.equal(
                        await delegationProxy[i].delegationOfAt(accounts[j], blockn1), 
                        delegationOf[i][j], 
                        "["+i+","+j+"] +"+delegationProxy[i].address+".delegationOfAt("+accounts[j]+", +"+blockn1+") is incorrect")
                    assert.equal(
                        await delegationProxy[i].delegationOfAt(accounts[j], blockn2), 
                        delegationOf2[i][j], 
                        "["+i+","+j+"] +"+delegationProxy[i].address+".delegationOfAt("+accounts[j]+", +"+blockn2+") is incorrect")
                    assert.equal(
                        await delegationProxy[i].delegationOfAt(accounts[j], blockn3), 
                        delegationOf3[i][j], 
                        "["+i+","+j+"] +"+delegationProxy[i].address+".delegationOfAt("+accounts[j]+", +"+blockn3+") is incorrect")
                }                    
            }

        })

        it("delegates back to parentProxy", async () => {
            for (var i = 0; i < delegateTo.length; i++) {
                for (var j = 0; j < delegateTo[i].length; j++) {
                    await delegationProxy[i].delegate(delegateTo[i][j], {from: accounts[j]});
                }                    
            }
            const blockn1 = web3.eth.blockNumber

            for (var j = 0; j < delegateTo[1].length; j++) {
                await delegationProxy[1].delegate(delegationProxy[0].address, {from: accounts[j]});
            }
            
            const blockn2 = web3.eth.blockNumber

            for (var j = 0; j < delegateTo[1].length; j++) {        
                assert.equal(
                    await delegationProxy[1].delegatedToAt(accounts[j], blockn1), 
                    delegateTo[1][j], 
                    "["+j+"] +"+delegationProxy[1].address+".delegatedToAt("+accounts[j]+", +"+blockn1+") is incorrect")
                assert.equal(
                    await delegationProxy[1].delegatedToAt(accounts[j], blockn2), 
                    delegateTo[0][j], 
                    "["+j+"] +"+delegationProxy[1].address+".delegatedToAt("+accounts[j]+", +"+blockn2+") is incorrect")
    
                assert.equal(
                    await delegationProxy[1].delegationOfAt(accounts[j], blockn1), 
                    delegationOf[1][j], 
                    "["+j+"] +"+delegationProxy[1].address+".delegationOfAt("+accounts[j]+", +"+blockn1+") is incorrect")
                assert.equal(
                    await delegationProxy[1].delegationOfAt(accounts[j], blockn2), 
                    delegationOf[0][j], 
                    "["+j+"] +"+delegationProxy[1].address+".delegationOfAt("+accounts[j]+", +"+blockn2+") is incorrect")
                
            }                    
        })
    })

    describe("delegatedToAt(address _who, uint _block)", () => {

        it("returns correctly delegated to address", async () => {
            let delegatedTo 
            for (var i = 0; i < delegateTo.length; i++) {
                for (var j = 0; j < delegateTo[i].length; j++) {
                    await delegationProxy[i].delegate(delegateTo[i][j], {from: accounts[j]});
                    delegatedTo = await delegationProxy[i].delegatedToAt(accounts[j], web3.eth.blockNumber)    
                    assert.equal(
                        delegatedTo, 
                        delegateTo[i][j], 
                        "["+i+","+j+"] +"+delegationProxy[i].address+".delegatedToAt("+accounts[j]+", +"+web3.eth.blockNumber+") is incorrect")
                    
                }                    
            }
        })
    })

    describe("delegationOfAt(address _who, uint _block)", () => {
        
        it("returns correctly delegation endpoints of address", async () => {
            let result = [[],[]]
            for (var i = 0; i < delegateTo.length; i++) {
                for (var j = 0; j < delegateTo[i].length; j++) {
                    await delegationProxy[i].delegate(delegateTo[i][j], {from: accounts[j]});       
                }
                for (j = 0; j < delegateTo[i].length; j++) {
                    assert.equal(
                        await delegationProxy[i].delegationOfAt(accounts[j], web3.eth.blockNumber), 
                        delegationOf[i][j], 
                        "["+i+","+j+"] +"+delegationProxy[i].address+".delegationOfAt("+accounts[j]+", +"+web3.eth.blockNumber+") is incorrect"
                    )
                }                    
            }   
        })
    })

    describe("delegatedInfluenceFromAt(address _who, address _token, uint _block)", () => {

        let miniMeTokenFactory
        let miniMeToken
        const tokensBalance = 1000

        beforeEach(async () => {
            miniMeTokenFactory = await MiniMeTokenFactory.new();
            miniMeToken = await MiniMeToken.new(miniMeTokenFactory.address, 0, 0, "TestToken", 18, "TTN", true)
            for (var i = 0; i < 6; i++) {
                miniMeToken.generateTokens(accounts[i], tokensBalance)
            }
        })

        it("returns expected amount of influence delegated from", async () => {
            
            for (var i = 0; i < delegationProxy.length; i++) {
                for (var j = 0; j < delegateTo[i].length; j++) {
                    await delegationProxy[i].delegate(delegateTo[i][j], {from: accounts[j]});    
                }
                for (var j = 0; j < delegatedInfluence[i].length; j++) {
                    assert.equal(
                        delegatedInfluence[i][j] * tokensBalance, 
                        (await delegationProxy[i].delegatedInfluenceFromAt(accounts[j], miniMeToken.address, web3.eth.blockNumber)).toNumber(),
                        "["+i+","+j+"] +"+delegationProxy[i].address+".delegatedInfluenceFrom("+accounts[j]+", +"+web3.eth.blockNumber+") is not as expected"
                    )    
                }                    
            }
        })
    })
    
    describe("influenceOfAt(address _who, address _token, uint _block)", () => {
        let miniMeTokenFactory
        let miniMeToken
        const tokensBalance = 1000

        beforeEach(async () => {
            miniMeTokenFactory = await MiniMeTokenFactory.new();
            miniMeToken = await MiniMeToken.new(miniMeTokenFactory.address, 0, 0, "TestToken", 18, "TTN", true)
            for (var i = 0; i < 6; i++) {
                miniMeToken.generateTokens(accounts[i], tokensBalance)
            }
        })

        it("returns expected influence", async () => {
            
            for (var i = 0; i < influence.length; i++) {
                for (var j = 0; j < delegateTo[i].length; j++) {
                    delegationProxy[i].delegate(delegateTo[i][j], {from: accounts[j]});    
                }
                for (var j = 0; j < influence[i].length; j++) {
                    assert.equal(
                        influence[i][j] * tokensBalance, 
                        (await delegationProxy[i].influenceOfAt(accounts[j], miniMeToken.address, web3.eth.blockNumber)).toNumber(),
                        "["+i+","+j+"] +"+delegationProxy[i].address+".influenceOfAt("+accounts[j]+", +"+web3.eth.blockNumber+") is not as expected")
                }                    
            }
        })
    })

})