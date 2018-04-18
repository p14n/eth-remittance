# eth-remittance
B9Labs course project

Progress

* Alice creates a Remittance contract with Ether in it and a puzzle.
* Alice sends a one-time-password to Bob; over SMS, say.
* Alice sends another one-time-password to Carol; over email, say.
* Bob treks to Carol's shop.
* Bob gives Carol his one-time-password.
* Carol submits both passwords to Alice's remittance contract.
* Only when both passwords are correct, the contract yields the Ether to Carol.
* Carol gives the local currency to Bob.
* Bob leaves.
* Alice is notified that the transaction went through.

Stretch goals:
* add a deadline, after which Alice can claim back the unchallenged Ether
* add a limit to how far in the future the deadline can be
* add a kill switch to the whole contract
* plug a security hole (which one?) by changing one password to the recipient's address
* make the contract a utility that can be used by David, Emma and anybody with an address
* make you, the owner of the contract, take a cut of the Ethers smaller than what it would cost Alice to deploy the same contract herself
