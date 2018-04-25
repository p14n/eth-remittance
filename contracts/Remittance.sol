pragma solidity ^0.4.17;

contract Remittance {

  
  bool killed = false;
  address owner;
  mapping(bytes32 => RemittanceInstance) instances;
  //  mapping(address => mapping(address => bytes32) payers;

  struct RemittanceInstance {
    address payer;
    address payee;
    uint amount;
  }

  event PaidEvent(uint amount,address recipient);
  event Instantiated(bytes32 hash,address recipient);
  event ToggleKill(bool killed);

  function Remittance() public {
    owner = msg.sender;
  }

  function createInstance(address payee,bytes32 hash) public payable {
    require(msg.value > 0);
    instances[hash] = RemittanceInstance(msg.sender,payee,msg.value);
    Instantiated(hash,payee);
  }

  function getInstance(address a,string pwd) private view returns (RemittanceInstance) {

    require(!killed);
    bytes32 hash = keccak256(a,pwd);
    RemittanceInstance memory r = instances[hash];
    require(r.amount > 0);
    return r;
  }

  function withdraw(string password) public {

    RemittanceInstance memory r = getInstance(msg.sender,password);
    require(msg.sender == r.payee);
    msg.sender.transfer(r.amount);
    PaidEvent(r.amount,msg.sender);

  }

  function reclaim(address payee,string password) public {

    RemittanceInstance memory r = getInstance(payee,password);
    require(msg.sender == r.payer);
    msg.sender.transfer(r.amount);
    PaidEvent(r.amount,msg.sender);

  }

  function toggleKill() public {
    require(msg.sender == owner);
    killed = !killed;
    ToggleKill(killed);
  }
}
