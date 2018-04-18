require('chai').use(require('chai-as-promised')).should();
var Remittance = artifacts.require("./Remittance.sol");

contract('Remittance', function ([alice,bob,carol]) {

    let remittance;
    beforeEach('setup contract for each test', async () => {
        remittance = await Remittance.new(bob,carol, { from: alice })
    })

});
