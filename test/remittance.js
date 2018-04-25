require('chai').use(require('chai-as-promised')).should();
var utils = require('web3-utils');
var expectedExceptionPromise = require('./expected_exception_testRPC_and_geth');


var Remittance = artifacts.require("./Remittance.sol");

contract('Remittance', function ([alice,bob,carol]) {

    let remittance;
    let hash;
    beforeEach('setup contract for each test', async () => {
        hash = await utils.soliditySha3(carol,"pwd");
        remittance = await Remittance.new(carol,
                                         hash,
                                          { from: alice,
                                            value: 20000})
    })

    it("should allow withdrawl on correct password",async () => {
        const c_balance = await web3.eth.getBalance(carol);
        const tx = await remittance.withdraw("pwd",
                                             { from: carol });
        const c_new = await web3.eth.getBalance(carol);
        let gasCost = await web3.eth.getTransaction(tx.tx)
                .gasPrice.times(tx.receipt.gasUsed);

        assert(c_balance.plus(20000).minus(gasCost).eq(c_new))
    })

    it("should prevent withdrawl on incorrect password",async () => {
        await expectedExceptionPromise( () => remittance.withdraw("nope",{ from: carol }));

    })
    it("should prevent withdrawl when killed",async () => {
        await remittance.toggleKill({ from:alice });
        await expectedExceptionPromise( () => remittance.withdraw("pwd",{ from: carol}))

    })
    it("should prevent withdrawl to incorrect account",async () => {
        await expectedExceptionPromise( () => remittance.withdraw("pwd",{ from: bob }))

    })




});
