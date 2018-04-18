require('chai').use(require('chai-as-promised')).should();
var Remittance = artifacts.require("./Remittance.sol");

contract('Remittance', function ([alice,bob,carol]) {

    let remittance;
    beforeEach('setup contract for each test', async () => {
        remittance = await Remittance.new(carol,
                                         "pwd",
                                          { from: alice,
                                            value: 20000})
    })

    it("should allow withdrawl on correct password",async () => {
        const c_balance = await web3.eth.getBalance(carol);
        const tx = await remittance.withdraw("pwd",
                                             { from: carol,
                                               gasPrice: 1});
        const c_new = await web3.eth.getBalance(carol);
        assert(c_balance.plus(20000).minus(tx.receipt.gasUsed).eq(c_new))
    })

    it("should prevent withdrawl on incorrect password",async () => {
        await remittance.withdraw("nope",{ from: carol,
                                           gasPrice: 1})
            .should.be.rejectedWith("VM Exception while processing transaction: revert");;

    })
    it("should prevent withdrawl to incorrect account",async () => {
        await remittance.withdraw("nope",{ from: bob,
                                           gasPrice: 1})
            .should.be.rejectedWith("VM Exception while processing transaction: revert");;

    })




});
