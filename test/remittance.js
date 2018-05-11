require('chai').use(require('chai-as-promised')).should();
var utils = require('web3-utils');
var expectedExceptionPromise = require('./expected_exception_testRPC_and_geth');

var Remittance = artifacts.require("./Remittance.sol");

contract('Remittance', function ([alice,bob,carol]) {

    let remittance;
    let hash;
    beforeEach('setup contract for each test', async () => {
        hash = await utils.soliditySha3(carol,"pwd");
        remittance = await Remittance.deployed();
    })

    it("should allow withdrawl on correct password",async () => {
        const c_balance = await web3.eth.getBalance(carol);
        await remittance.createInstance(carol,hash,{from:alice,value:20000});
        const tx = await remittance.withdraw("pwd",
                                             { from: carol });
        const c_new = await web3.eth.getBalance(carol);
        let gasCost = await web3.eth.getTransaction(tx.tx)
                .gasPrice.times(tx.receipt.gasUsed);

        assert(c_balance.plus(20000).minus(gasCost).eq(c_new))
    })

    it("should allow reclaim on correct password",async () => {
        const a_balance1 = await web3.eth.getBalance(alice);
        const tx1 = await remittance.createInstance(carol,hash,{from:alice,value:20000});
        const a_balance2 = await web3.eth.getBalance(alice);
        const tx2 = await remittance.reclaim(carol,"pwd",
                                             { from: alice });
        const a_balance3 = await web3.eth.getBalance(alice);
        let gasCost1 = await web3.eth.getTransaction(tx1.tx)
                .gasPrice.times(tx1.receipt.gasUsed);
        let gasCost2 = await web3.eth.getTransaction(tx2.tx)
                .gasPrice.times(tx2.receipt.gasUsed);
        assert(a_balance1.minus(20000).minus(gasCost1).eq(a_balance2));
        assert(a_balance1.minus(gasCost2).minus(gasCost1).eq(a_balance3));

    })

    it("should prevent withdrawl on incorrect password",async () => {
        remittance.createInstance(carol,hash,{from:alice,value:20000});
        await expectedExceptionPromise( () => remittance.withdraw("nope",{ from: carol }));

    })
    it("should prevent withdrawl when killed",async () => {
        await remittance.createInstance(carol,hash,{from:alice,value:20000});
        await remittance.setKilled(true,{ from:alice });
        await expectedExceptionPromise( () => remittance.withdraw("pwd",{ from: carol}))

    })
    it("should prevent withdrawl to incorrect account",async () => {
        await expectedExceptionPromise( () => remittance.withdraw("pwd",{ from: bob }))

    })

});
