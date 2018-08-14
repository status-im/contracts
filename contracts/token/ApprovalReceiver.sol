pragma solidity ^0.4.11;

contract ApprovalReceiver {
  function receiveApproval(address from, uint value, address tokenContract, bytes extraData) returns (bool);
}
