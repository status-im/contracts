pragma solidity ^0.4.21;

contract FailTest {

    event Calling(address indexed sender, uint256 testcase, string input);
    event Start(uint256 testcase);
    event End(uint256 testcase);

    string public dataStored = "Initialized";

    function testMethod(uint256 _case, string input) external returns (string someReturn) {
        emit Calling(msg.sender, _case, input);
        emit Start(_case);
        dataStored = input;
        someReturn = "A String 01";
        if(_case == 1) {
            throw;
        } else if(_case == 2) {
            revert();
        } else if(_case == 3) {
            require(false);
        } else if(_case == 4) {
            require(false, "B String 02");
        } else if(_case == 5) {
            revert("C String 03");
        } else if(_case == 6) {
            assert(false);
        }
     
        emit End(_case);
    
    }

}