pragma solidity ^0.4.17;


contract TestContract {

    event TestFunctionExecuted();

    function test() public {
        TestFunctionExecuted();
    }   
}