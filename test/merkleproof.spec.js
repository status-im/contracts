const { MerkleTree } = require('../utils/merkleTree.js');
const { sha3, bufferToHex } = require('ethereumjs-util');

const MerkleProofWrapper = require('Embark/contracts/MerkleProofWrapper');

var contractsConfig = {
    "MerkleProofWrapper": {
        
    }
  };

config({ contracts: contractsConfig });

contract('MerkleProof', function () {

  describe('verifyProof', function () {
    it('should return true for a valid Merkle proof', async function () {
      const elements = ['a', 'b', 'c', 'd'];
      const merkleTree = new MerkleTree(elements);

      const root = merkleTree.getHexRoot();

      const proof = merkleTree.getHexProof(elements[0]);

      const leaf = bufferToHex(sha3(elements[0]));
      console.log(root);
      console.log(proof);
      console.log(leaf);
      var result = await MerkleProofWrapper.methods.verifyProof(proof, root, leaf).call();
      console.log(result);
      //assert(result, true);
    });

    it('should return false for an invalid Merkle proof', async function () {
      const correctElements = ['a', 'b', 'c'];
      const correctMerkleTree = new MerkleTree(correctElements);

      const correctRoot = correctMerkleTree.getHexRoot();

      const correctLeaf = bufferToHex(sha3(correctElements[0]));

      const badElements = ['d', 'e', 'f'];
      const badMerkleTree = new MerkleTree(badElements);

      const badProof = badMerkleTree.getHexProof(badElements[0]);

      var result = await MerkleProofWrapper.methods.verifyProof(badProof, correctRoot, correctLeaf).call();
      console.log(result);
      //assert(result, false);
    });

    it('should return false for a Merkle proof of invalid length', async function () {
      const elements = ['a', 'b', 'c'];
      const merkleTree = new MerkleTree(elements);

      const root = merkleTree.getHexRoot();

      const proof = merkleTree.getHexProof(elements[0]);
      const badProof = proof.slice(0, proof.length - 5);

      const leaf = bufferToHex(sha3(elements[0]));

      var result = await MerkleProofWrapper.methods.verifyProof(badProof, root, leaf).call()
      console.log(result);
      //assert(result, false);
    });
  });
});
