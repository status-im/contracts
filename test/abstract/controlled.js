
exports.Test = (Controlled) => {
    describe("Controlled", async function() {
        this.timeout(0);
        var accounts;
        before(function(done) {
            web3.eth.getAccounts().then(function (res) {
                accounts = res;
                done();
            });
        });
        
        
        it("should start with msg.sender as controller", async function() {
            var controller = await Controlled.methods.controller().call();
            assert(controller, accounts[0]);
        });

        it("should allow controller to set new controller", async function() {
            await Controlled.methods.changeController(accounts[1]).send({from: accounts[0]});
            var controller = await Controlled.methods.controller().call();
            assert(controller, accounts[1]);
        });
    }); 
}