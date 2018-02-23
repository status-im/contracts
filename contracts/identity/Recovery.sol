pragma solidity ^0.4.17;

import "./Identity.sol";


contract Recovery {
    address private identityContract;
    address newManager;
    bytes32[] private recoveryHashes;

    event RecoveryHashesChangeRequested(address sender);
    event RecoveryHashesChanged(address sender, bytes32[] oldRecoveryHashes, bytes32[] newRecoveryHashes);

    function Recovery(Identity _identity, bytes32[] _recoveryHashes) public {
        // Identity owner submits Recovery hashes which should be done offchain
        // keccak256(pubKey + secret)
        identityContract = _identity;
        recoveryHashes = _recoveryHashes;
    }

    function getNewManager() public view returns (address){
        return newManager;
    }

    function recover(address[] _friendKeys, bytes32[] _secrets) public {
        if (_matchesRecoveryHashes(_friendKeys, _secrets)) {
            newManager = msg.sender;
        }
    }

    function changeRecoveryHashes(address[] _friendKeys, bytes32[] _secrets, bytes32[] _newRecoveryHashes) 
        public
        returns(bool success) 
    {
        RecoveryHashesChangeRequested(msg.sender);
        if (_matchesRecoveryHashes(_friendKeys, _secrets)) {
            RecoveryHashesChanged(msg.sender, recoveryHashes, _newRecoveryHashes);
            recoveryHashes = _newRecoveryHashes;
            return true;
        }
    }

    function _matchesRecoveryHashes(address[] _friendKeys, bytes32[] _secrets)
        private
        view
        returns(bool) 
    {
        require(_friendKeys.length == _secrets.length);
        require(_friendKeys.length == recoveryHashes.length);
        
        uint256 hashMatches = 0;

        for (uint256 i = 0; i < recoveryHashes.length; i++)
            if (keccak256(_friendKeys[i], _secrets[i]) == recoveryHashes[i])
                hashMatches++;

        return (hashMatches == recoveryHashes.length);
    }

}