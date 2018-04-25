pragma solidity ^0.4.17;

contract Remittance {

  bytes32 hash;
  bool killed = false;
  address owner;
  address recipient;

  event PaidEvent(uint amount,address recipient);
  event Instantiated(bytes32 hash,address recipient);
  event ToggleKill(bool killed);

  function Remittance (address _recipient,bytes32 _hash) public payable {
    owner = msg.sender;
    hash = _hash;
    recipient = _recipient;
    Instantiated(_hash,_recipient);
  }
  
  function withdraw(string password) public {

    require(!killed);
    require(msg.sender == recipient);
    require(hash == keccak256(msg.sender,password));
    require(this.balance > 0);

    uint toSend = this.balance;
    msg.sender.transfer(this.balance);
    PaidEvent(toSend,msg.sender);
  }
  function toggleKill() public {
    require(msg.sender == owner);
    killed = !killed;
    ToggleKill(killed);
  }
}
