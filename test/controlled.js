
exports.Test = (contractsConfig, afterDeploy) => {

    describe("Controlled", async function() {
        this.timeout(0);
        var Controlled;
        var accountsArr;
        before(function(done) {
            EmbarkSpec.deployAll(contractsConfig, async function(accounts) { 
                Controlled = Contract;
                accountsArr = accounts; 
                await afterDeploy(accounts, Contract);
                done()
            });
        });
        
        
        it("should start with msg.sender as controller", async function() {
            var controller = await Controlled.methods.controller().call();
            assert(controller, accountsArr[0]);
        });

        it("should allow controller to set new controller", async function() {
            await Controlled.methods.changeController(accountsArr[1]).send({from: accountsArr[0]});
            var controller = await Controlled.methods.controller().call();
            assert(controller, accountsArr[1]);
        });
    }); 
}