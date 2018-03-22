let Identity = artifacts.require("./Identity.sol");

module.exports = function(deployer) {
  deployer.deploy(Identity);
};
