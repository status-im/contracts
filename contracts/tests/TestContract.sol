pragma solidity ^0.4.17;


contract TestContract {

    event TestFunctionExecuted();

    function test() public {
        TestFunctionExecuted();
    }   


    /*
    Helper function to be used in unit testing due to error in web3
    web3.utils.soliditySha3([1, 2, 3])
    Error: Autodetection of array types is not supported.
    at _processSoliditySha3Args (node_modules/web3-utils/src/soliditySha3.js:176:15)
    */
    function hash(
        address identity,
        bytes32 _revealedSecret,
        address _dest,
        bytes _data,
        bytes32 _newSecret,
        bytes32[] _newFriendsHashes)
        external
        pure
        returns(bytes32)
    {
        return keccak256(identity, _revealedSecret, _dest, _data, _newSecret, _newFriendsHashes);
        
    }

}