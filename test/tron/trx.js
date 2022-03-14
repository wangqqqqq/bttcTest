const { write,find,remove } = require('../utils/publicMethods')
const { getTronWebClient, getTronWebInstance, pos } = require('../utils/utils')
const { user, tronWebOptions } = require('../utils/config')
const BigNumber = require('bignumber.js')
const wait = require('../utils/wait')
const util = require('util')
const chai = require('chai')
const assert = chai.assert

const userPk = user.privateKey
const userAddr = user.address
const tronWeb = getTronWebInstance()
const userAddrTron = tronWebOptions.address
const tronClient = getTronWebClient(userPk,userAddr)

const trxSideToken = pos.TRON.trxSide
const etherPredicateMain = pos.TRON.etherPredicate

describe('tron trx test', function() {
    this.timeout(2000000)
    const depositAmount = 1e8
    describe('#trx', function() {
        it('deposit', async function() {
            // balance before deposit
            const userBalanceBeforeMain = await tronWeb.trx.getBalance(userAddrTron)
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)
            let userBalanceBeforeSide = await tronClient.balanceOfERC20(userAddr, trxSideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)
            const predicateBalanceBeforeMain = await tronWeb.trx.getBalance(etherPredicateMain)
            console.log(`====predicateBalanceBeforeMain====`, predicateBalanceBeforeMain)

            // deposit
            const depositTx = await tronClient.depositEtherForUser(userAddr, depositAmount,{
                from:userAddr,
                gasPrice: 900000000000,
                gas: 300000,
            })
            console.log(`====depositTx====`, depositTx)
            let userBalanceAfterSide
            let depositInfo
            await wait(60)
            while (true) {
                userBalanceAfterSide = await tronClient.balanceOfERC20(userAddr, trxSideToken, {parent:false})
                console.log(`====userBalanceAfterSide====`, userBalanceAfterSide)
                console.log(`====userBalanceAfterSide - userBalanceBeforeSide====`, new BigNumber(userBalanceAfterSide).minus(userBalanceBeforeSide).toString())
                if (new BigNumber(userBalanceAfterSide).minus(userBalanceBeforeSide).toString() > 0) {
                    depositInfo =await tronWeb.trx.getTransactionInfo(depositTx);
                    console.log("depositInfo:"+depositInfo)
                    assert.equal("SUCCESS", depositInfo.receipt.result);
                    break
                } else {
                    await wait(60)
                    continue
                }
            }

            // balance after deposit
            const userBalanceAfterMain = await tronWeb.trx.getBalance(userAddrTron)
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            userBalanceAfterSide = await tronClient.balanceOfERC20(userAddr, trxSideToken, {parent:false})
            console.log(`====userBalanceAfterSide====`, userBalanceAfterSide)
            const depositTxFee = typeof(depositInfo.fee)=="undefined"?0:depositInfo.fee;
            assert.equal(new BigNumber(userBalanceBeforeMain).minus(userBalanceAfterMain).toString(), depositAmount+depositTxFee)
            assert.equal(new BigNumber(userBalanceAfterSide).minus(userBalanceBeforeSide).toString(), depositAmount)

            const predicateBalanceAfterMain = await tronWeb.trx.getBalance(etherPredicateMain)
            console.log(`====predicateBalanceAfterMain====`, predicateBalanceAfterMain)
            assert.equal(new BigNumber(predicateBalanceAfterMain).minus(predicateBalanceBeforeMain).toString(), depositAmount)
        })

        it('burn', async function() {
            let userBalanceBeforeSide = await tronClient.balanceOfERC20(userAddr, trxSideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)

            // burn
            const tx = await tronClient.burnERC20({ childToken: trxSideToken, withdrawTo: true, amount:depositAmount, to:userAddr}, {
                from: userAddr,
                gasPrice: 900000000000,
                gas: 300000,
            })
            console.log(`====burnTx====`, tx)

            // balance after burn
            let userBalanceAfterBurnSide = await tronClient.balanceOfERC20(userAddr, trxSideToken, {parent:false})
            console.log(`====userBalanceAfterBurnSide====`, userBalanceAfterBurnSide)
            assert.equal(new BigNumber(userBalanceBeforeSide).minus(userBalanceAfterBurnSide).toString(), depositAmount)

            // write
            assert.equal(await write('tron-trxBurnHash:'+tx.transactionHash+',tokenAmount:'+depositAmount),true)
            process.exit(0)
        })

        it('exit', async function() {
            // balance before exit
            let userBalanceBeforeMain = await tronWeb.trx.getBalance(userAddrTron)
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)

            // exit
            let map = await find('tron-trxBurnHash')
            const burnHash = map.get('hash')
            console.log("burnHash:"+burnHash)
            const tokenAmount = map.get('tokenAmount')
            const tx = await tronClient.exitERC20(burnHash,{
                from: userAddr,
                legacyProof: true,
                parent: true,
            })
            console.log(`====exitTx====`, tx)

            // balance after exit
            const userBalanceAfterMain = await tronWeb.trx.getBalance(userAddrTron)
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            assert.equal(new BigNumber(userBalanceAfterMain).minus(userBalanceBeforeMain).toString(), tokenAmount)

            // remove
            assert.equal(await remove(burnHash),true)
        })
    })
    after(async function () {
        process.exit()
    })
})