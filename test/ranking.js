const utils = require('../utils/testUtils');
const Ranking = require('Embark/contracts/Ranking');

config({
    contracts: {
        "Ranking": {
            "args":["$MiniMeTokenFactory", "0x0", "0x0", "Status Test Token", 18, "STT", true],
        }
    }
});

const item_0a = "0x0a00000000000000000000000000000000000000000000000000000000000000"
const item_0b = "0x0b00000000000000000000000000000000000000000000000000000000000000"
const item_0c = "0x0c00000000000000000000000000000000000000000000000000000000000000"
const item_0d = "0x0d00000000000000000000000000000000000000000000000000000000000000"
const item_0e = "0x0e00000000000000000000000000000000000000000000000000000000000000"
const item_0f = "0x0f00000000000000000000000000000000000000000000000000000000000000"
const item_aa = "0xaa00000000000000000000000000000000000000000000000000000000000000"
const item_bb = "0xbb00000000000000000000000000000000000000000000000000000000000000"
const item_cc = "0xcc00000000000000000000000000000000000000000000000000000000000000"
const item_dd = "0xdd00000000000000000000000000000000000000000000000000000000000000"
const item_ee = "0xee00000000000000000000000000000000000000000000000000000000000000"
const item_ff = "0xff00000000000000000000000000000000000000000000000000000000000000"

async function printRanking(Ranking) {
    var next = await Ranking.methods.top().call();
    console.log("Ranking: ")
    var i = 0;
    while(next != utils.zeroBytes32){
        console.log(
            i++,
            "item_" + (next).substring(2,4), 
            "points " + await Ranking.methods.pointsOf(next).call(),
            "timestamp " + await Ranking.methods.timestampOf(next).call(),
            "prev item_" + (await Ranking.methods.previousOf(next).call()).substring(2,4),
            "next item_" + (await Ranking.methods.nextOf(next).call()).substring(2,4),  
        );
        next = await Ranking.methods.nextOf(next).call();
    }
}

contract("Ranking", function() {
    this.timeout(0);
    var accounts;
    before(function(done) {
        web3.eth.getAccounts().then(function (res) {
            accounts = res;
            done();
        });
    });

    it("should begin with empty top", async function() {
        let top = await Ranking.methods.top().call();
        assert.equal(top, utils.zeroBytes32);
    });

    it("should not include in unexistent element while top empty", async function() {
        try{
            await Ranking.methods.include(
                item_0a,
                accounts[1],
                100000000,
                item_0f
                ).send({from: accounts[0]});    
        } catch (error) {
            return utils.ensureException(error);
        }
        assert.fail('did not fail'); 
    });

    it("should include first as top", async function() {
        await Ranking.methods.include(
            item_0a,
            accounts[1],
            100000000,
            utils.zeroBytes32
        ).send({from: accounts[0]});
        assert.equal(await Ranking.methods.top().call(), item_0a, "top is item_0a")
        assert.equal(await Ranking.methods.previousOf(item_0a).call(), utils.zeroBytes32, "item_0a previous is null (head)")
        assert.equal(await Ranking.methods.nextOf(item_0a).call(), utils.zeroBytes32, "item_0a next is null (tail)")
    })

    it("should not include as top if new not top", async function() {
        try{
            await Ranking.methods.include(
                item_0b,
                accounts[1],
                99999990,
                utils.zeroBytes32
            ).send({from: accounts[0]});
        } catch (error) {
            return utils.ensureException(error);
        }
        
        assert.fail('did not fail');
    })

    it("should not include with previous to non existent element", async function() {
        try{
            await Ranking.methods.include(
                item_0b,
                accounts[1],
                99999990,
                item_0c,
            ).send({from: accounts[0]});
        } catch (error) {
            return utils.ensureException(error);
        }
        assert.fail('did not fail');
    })

    it("should second include with previous as top", async function() {
        await Ranking.methods.include(
            item_0b,
            accounts[1],
            99999990,
            item_0a
        ).send({from: accounts[0]});
        
        assert.equal(
            await Ranking.methods.nextOf(item_0a).call(),
            item_0b, 
            "item_0a next is item_0b"
        )   
        assert.equal(
            await Ranking.methods.previousOf(item_0b).call(), 
            item_0a, 
            "item_0b previous is item_0a"
        )
        assert.equal(
            await Ranking.methods.nextOf(item_0b).call(),
            utils.zeroBytes32, 
            "item_0b next is null (tail)"
        )

    })

    it("should include third with second as previous", async function() {
        await Ranking.methods.include(
            item_0c,
            accounts[1],
            99999980,
            item_0b
        ).send({from: accounts[0]});
        
        assert.equal(
            await Ranking.methods.nextOf(item_0b).call(),
            item_0c, 
            "item_0b next is item_0c"
        )   
        assert.equal(
            await Ranking.methods.previousOf(item_0c).call(), 
            item_0b, 
            "item_0c previous is item_0b"
        )
        assert.equal(
            await Ranking.methods.nextOf(item_0c).call(),
            utils.zeroBytes32, 
            "item_0c next is null (tail)"
        )
    })
    
    it("should not include forth with second as previous", async function() {
        try{
            await Ranking.methods.include(
                item_0d,
                accounts[1],
                99999970,
                item_0b
            ).send({from: accounts[0]});  
        } catch (error) {
            return utils.ensureException(error);
        }
        assert.fail('did not fail');
    })

    it("should not include a zero element", async function() {
        try{
            await Ranking.methods.include(
                utils.zeroBytes32,
                accounts[1],
                99999970,
                item_0b
            ).send({from: accounts[0]});
        } catch (error) {
            return utils.ensureException(error);
        }
        assert.fail('did not fail');
    })

    it("should include a couple of objects in correct order", async function() {
        await Ranking.methods.include(
            item_0d,
            accounts[1],
            99999970,
            item_0c
        ).send({from: accounts[0]});

        await Ranking.methods.include(
            item_0e,
            accounts[1],
            99999960,
            item_0d
        ).send({from: accounts[0]});
        
        assert.equal(
            await Ranking.methods.nextOf(item_0c).call(),
            item_0d, 
            "item_0c next is item_0d"
        )   
        assert.equal(
            await Ranking.methods.nextOf(item_0d).call(),
            item_0e, 
            "item_0d next is item_0e"
        )   
        assert.equal(
            await Ranking.methods.previousOf(item_0d).call(), 
            item_0c, 
            "item_0d previous is item_0c"
        )
        assert.equal(
            await Ranking.methods.previousOf(item_0e).call(), 
            item_0d, 
            "item_0e previous is item_0d"
        )
        assert.equal(
            await Ranking.methods.nextOf(item_0e).call(),
            utils.zeroBytes32, 
            "item_0e next is null (tail)"
        )
        await printRanking(Ranking)

    })

    it("should include a new position in middle", async function() {
        console.log("Ranking.methods.include(item_0f,accounts[1],99999965,item_0d)")
        await Ranking.methods.include(
            item_0f,
            accounts[1],
            99999965,
            item_0d
        ).send({from: accounts[0]});
        await printRanking(Ranking)
        assert.equal(
            await Ranking.methods.nextOf(item_0d).call(),
            item_0f, 
            "item_0d next is item_0f"
        )
        assert.equal(
            await Ranking.methods.previousOf(item_0f).call(), 
            item_0d, 
            "item_0f previous is item_0d"
        )
        assert.equal(
            await Ranking.methods.nextOf(item_0f).call(),
            item_0e, 
            "item_0f next is item_0e"
        )
        assert.equal(
            await Ranking.methods.previousOf(item_0e).call(), 
            item_0f, 
            "item_0e previous is item_0f"
        )
    })

    it("should not increase points and move to wrong position", async function() {
        try{
            await Ranking.methods.increase(
                item_0f,
                10,
                item_0b
            ).send({from: accounts[0]});
        } catch (error) {
            return utils.ensureException(error);
        }
        
        assert.fail('did not fail');
    })


    it("should not increase points and move to top", async function() {
        try{
            await Ranking.methods.increase(
                item_0f,
                10,
                utils.zeroBytes32
            ).send({from: accounts[0]});
        } catch (error) {
            return utils.ensureException(error);
        }
        
        assert.fail('did not fail');
    })


    it("should increase points and move to correct position", async function() {
        console.log("Ranking.methods.increase(item_0f,10,item_0c)")
        await Ranking.methods.increase(
            item_0f,
            10,
            item_0c
        ).send({from: accounts[0]});
        await printRanking(Ranking)
        assert.equal(
            await Ranking.methods.nextOf(item_0c).call(),
            item_0f, 
            "item_0c next is item_0f"
        )
        assert.equal(
            await Ranking.methods.previousOf(item_0f).call(), 
            item_0c, 
            "item_0f previous is item_0c"
        )
        assert.equal(
            await Ranking.methods.nextOf(item_0f).call(),
            item_0d, 
            "item_0f next is item_0d"
        )
        assert.equal(
            await Ranking.methods.previousOf(item_0d).call(), 
            item_0f, 
            "item_0d previous is item_0f"
        )
        assert.equal(
            await Ranking.methods.nextOf(item_0d).call(),
            item_0e, 
            "item_0d next is item_0e"
        )
    })
    it("should decrease points and move to correct position", async function() {
        await Ranking.methods.decrease(
            item_0f,
            10,
            item_0d
        ).send({from: accounts[0]});             

        assert.equal(
            await Ranking.methods.nextOf(item_0d).call(),
            item_0f, 
            "item_0d next is item_0f"
        )
        assert.equal(
            await Ranking.methods.previousOf(item_0f).call(), 
            item_0d, 
            "item_0f previous is item_0d"
        )
        assert.equal(
            await Ranking.methods.nextOf(item_0f).call(),
            item_0e, 
            "item_0f next is item_0e"
        )
        assert.equal(
            await Ranking.methods.previousOf(item_0e).call(), 
            item_0f, 
            "item_0e previous is item_0f"
        )
        assert.equal(
            await Ranking.methods.nextOf(item_0c).call(),
            item_0d, 
            "item_0c next is item_0d"
        )
    })

    it("should not decrease points and move to wrong position", async function() {
        try{
            await Ranking.methods.decrease(
                item_0f,
                10,
                item_0a
            ).send({from: accounts[0]});
        } catch (error) {
            return utils.ensureException(error);
        }
        assert.fail('did not fail');
    })

    it("should increase points and move to top", async function() {
        await Ranking.methods.increase(
            item_0f,
            100,
            utils.zeroBytes32
        ).send({from: accounts[0]});

        assert.equal(await Ranking.methods.top().call(), item_0f, "top is item_0f")
        assert.equal(
            await Ranking.methods.previousOf(item_0f).call(), 
            utils.zeroBytes32, 
            "item_0f previous is null (top)"
        )
        assert.equal(
            await Ranking.methods.nextOf(item_0f).call(),
            item_0a, 
            "item_0f next is item_0a"
        )
        assert.equal(
            await Ranking.methods.previousOf(item_0a).call(), 
            item_0f, 
            "item_0a previous is item_0f"
        )

        assert.equal(
            await Ranking.methods.nextOf(item_0d).call(),
            item_0e, 
            "item_0d next is item_0e"
        )
        assert.equal(
            await Ranking.methods.previousOf(item_0e).call(), 
            item_0d, 
            "item_0e previous is item_0d"
        )
    })

    it("should decrease points and move to tail", async function() {
        await Ranking.methods.decrease(
            item_0f,
            200,
            item_0e
        ).send({from: accounts[0]});

        assert.equal(await Ranking.methods.top().call(), item_0a, "top is item_0a")
        assert.equal(
            await Ranking.methods.previousOf(item_0a).call(), 
            utils.zeroBytes32, 
            "item_0a previous is null (top)"
        )
        assert.equal(
            await Ranking.methods.nextOf(item_0f).call(),
            "0x0000000000000000000000000000000000000000000000000000000000000000", 
            "item_0f next is null (tail)"
        )
        assert.equal(
            await Ranking.methods.previousOf(item_0f).call(), 
            item_0e, 
            "item_0f previous is item_0e"
        )
        assert.equal(
            await Ranking.methods.nextOf(item_0e).call(),
            item_0f, 
            "item_0e next is item_0f"
        )
    })
    it("should decrease points and be excluded from tail of list", async function() {
        let points = await Ranking.methods.pointsOf(item_0f).call();
        await Ranking.methods.decrease(
            item_0f,
            points,
            utils.zeroBytes32
        ).send({from: accounts[0]});
        // assert item_0f is gone
        assert.equal(
            await Ranking.methods.nextOf(item_0e).call(),
            utils.zeroBytes32, 
            "item_0e next is null (tail)"
        )
    })
    it("should decrease points and be excluded from middle of list", async function() {
        let points = await Ranking.methods.pointsOf(item_0c).call();
        await Ranking.methods.decrease(
            item_0c,
            points,
            utils.zeroBytes32
        ).send({from: accounts[0]});
        
        // assert item_0c is gone
        assert.equal(
            await Ranking.methods.previousOf(item_0d).call(), 
            item_0b, 
            "item_0b is previous of item_0d"
        )
        assert.equal(
            await Ranking.methods.nextOf(item_0b).call(),
            item_0d, 
            "item_0d is next of item_0b"
        )
    })
    it("should decrease points and be excluded from top of list", async function() {
        let points = await Ranking.methods.pointsOf(item_0a).call()
        await Ranking.methods.decrease(
            item_0a,
            points,
            utils.zeroBytes32
        ).send({from: accounts[0]});  
        
        // assert item_0a is gone
        assert.equal(await Ranking.methods.top().call(), item_0b, "top is item_0f")
        assert.equal(
            await Ranking.methods.previousOf(item_0b).call(), 
            utils.zeroBytes32, 
            "null is previous of item_0b (head)"
        )  
    })
    it("should include at top", async function() {
        await Ranking.methods.include(
            item_aa,
            accounts[1],
            200000000,
            utils.zeroBytes32
        ).send({from: accounts[0]});
        assert.equal(await Ranking.methods.top().call(), item_aa, "top is item_aa")
        assert.equal(await Ranking.methods.previousOf(item_aa).call(), utils.zeroBytes32, "item_aa previous is null (head)")
        assert.equal(await Ranking.methods.nextOf(item_aa).call(), item_0b, "item_aa next is item_0b")
        assert.equal(
            await Ranking.methods.previousOf(item_0b).call(), 
            item_aa, 
            "item_aa is previous of item_0b"
        )
    })
    it("should include a couple with same points", async function() {
        await Ranking.methods.include(
            item_bb,
            accounts[1],
            190000000,
            item_aa
        ).send({from: accounts[0]});
        await utils.increaseTime(1000);
        await Ranking.methods.include(
            item_cc,
            accounts[1],
            190000000,
            item_bb
        ).send({from: accounts[0]});
        await utils.increaseTime(1000);
    })
    it("should not include with same value in wrong position", async function() {
        try{
            await Ranking.methods.include(
                item_dd,
                accounts[1],
                190000000,
                item_aa
            ).send({from: accounts[0]});
        } catch (error) {
            return utils.ensureException(error);
        } 
        assert.fail('did not fail');
    })
    it("should decrease to same points", async function() {
        await Ranking.methods.include(
            item_dd,
            accounts[1],
            180000000,
            item_cc
        ).send({from: accounts[0]});
        await utils.increaseTime(1000);

        await Ranking.methods.include(
            item_ee,
            accounts[1],
            170000000,
            item_dd
        ).send({from: accounts[0]});
        await utils.increaseTime(1000);

        await Ranking.methods.include(
            item_ff,
            accounts[1],
            160000000,
            item_ee
        ).send({from: accounts[0]});
        await utils.increaseTime(1000);

        await Ranking.methods.decrease(
            item_dd,
            20000000,
            item_ee
        ).send({from: accounts[0]});
    })
    it("should increase to same points", async function() {
        await Ranking.methods.increase(
            item_dd,
            15000000,
            item_cc
        ).send({from: accounts[0]});

        await Ranking.methods.increase(
            item_ff,
            15000000,
            item_dd
        ).send({from: accounts[0]});
    })    
});
