pragma solidity ^0.4.23;

contract IPollFactory {
    function create(bytes _description) public returns(address);
}
