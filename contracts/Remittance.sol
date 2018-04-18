pragma solidity ^0.4.17;

contract Remittance {

  bytes32 hash;

  event PaidEvent(uint amount,address recipient);

  function Remittance (address recipient,bytes32 password) public payable {
    hash = keccak256(recipient,password);
  }

  function withdraw(bytes32 password) public {
    require(hash == keccak256(msg.sender,password));
    uint toSend = this.balance;
    msg.sender.transfer(this.balance);
    PaidEvent(toSend,msg.sender);
   }

}
