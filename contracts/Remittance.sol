pragma solidity ^0.4.17;

contract Remittance {

  bool killed = false;
  address owner;
  mapping(bytes32 => RemittanceInstance) instances;

  struct RemittanceInstance {
    address payer;
    address payee;
    uint amount;
  }

  event PaidEvent(uint amount,address indexed from,address indexed to);
  event ReclaimedEvent(uint amount,address indexed from,address indexed to);
  event Instantiated(bytes32 hash,address indexed from,address indexed to);
  event KilledStateChange(bool killed);

  constructor() public {
    owner = msg.sender;
  }

  function createInstance(address payee,bytes32 hash) public payable {
    require(msg.value > 0);
    instances[hash] = RemittanceInstance(msg.sender,payee,msg.value);
    emit Instantiated(hash,msg.sender,payee);
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
    emit PaidEvent(r.amount,r.payer,msg.sender);

  }

  function reclaim(address payee,string password) public {

    RemittanceInstance memory r = getInstance(payee,password);
    uint toPay = r.amount;
    r.amount = 0;
    require(msg.sender == r.payer);
    msg.sender.transfer(toPay);
    emit ReclaimedEvent(toPay,payee,msg.sender);

  }

  function setKilled(bool _killed) public {
    require(msg.sender == owner);
    killed = _killed;
    emit KilledStateChange(killed);
  }
}
