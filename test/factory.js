const TestUtils = require("./TestUtils.js")
const Identity = artifacts.require("./identity/Identity.sol");
const IdentityFactory = artifacts.require("./identity/IdentityFactory.sol");

contract('IdentityFactory', function(accounts) {

    let identityFactory;

    beforeEach(async () => {
        identityFactory = await IdentityFactory.new("0x0", {from: accounts[0]});     
    })

    describe("IdentityFactory()", () => {

        it("test1", async () => {

        });

    });

});