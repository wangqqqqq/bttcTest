const { getTronWebClient, getEthClient, getTronWebInstance, from, pos } = require('../utils/utils')
const {subtract, evaluate, log, pi, pow, round, sqrt} = require('mathjs')
const BigNumber = require('bignumber.js')
const wait = require('../utils/wait')
const chai = require('chai')
const assert = chai.assert
const util = require('util')
var fs = require('fs')

const tronClient = getTronWebClient()
const tronWeb = getTronWebInstance()
const ethClient = getEthClient()

const erc20MainToken = pos.TRON.merc20Main
const erc20SideToken = pos.TRON.merc20Side
const erc20PredicateMain = pos.TRON.merc20PredicateMain
const approveAmount = '9999999999999999999999'

describe('tron erc20 test', function() {
    this.timeout(1000000)
    describe('#no mintable--mintable', function() {
        it('deposit', async function() {
            // approve
            transaction = await tronWeb.transactionBuilder.triggerConstantContract(erc20MainToken.replace('0x', '41'), 'allowance(address,address)', {},
                [{type: 'address', value: from.replace('0x', '41')},{type: 'address', value: erc20PredicateMain.replace('0x', '41')}], from.replace('0x', '41'))
            if (tronWeb.BigNumber(transaction.constant_result, 16) < 100) {
                const result = await tronClient.approveERC721ForDeposit(erc20MainToken, approveAmount, {from})
                console.log('====approve-result===='+result)
                await wait(10)
            }

            // balance before deposit
            let userBalanceBeforeMain = new BigNumber((await tronClient.balanceOfERC20(from, erc20MainToken, {parent:true}))._hex,16).toString()
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)
            let userBalanceBeforeSide = await tronClient.balanceOfERC20(from, erc20SideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)
            const predicateBalanceBeforeMain = new BigNumber((await tronClient.balanceOfERC20(erc20PredicateMain, erc20MainToken, {parent:true}))._hex,16).toString()
            console.log(`====predicateBalanceBeforeMain====`, predicateBalanceBeforeMain)

            // deposit
            const depositAmount = 100000000
            const depositTx = await getTronWebClient().depositERC20ForUser(erc20MainToken, from, depositAmount)
            console.log(`====depositTx====`, depositTx)
            let depositInfo
            let userBalanceAfterSide
            await wait(60)
            while (true) {
                depositInfo = await tronWeb.trx.getTransactionInfo(depositTx)
                userBalanceAfterSide = await tronClient.balanceOfERC20(from, erc20SideToken, {parent:false})
                console.log(`====userBalanceAfterSide====`, userBalanceAfterSide)
                console.log(`====userBalanceAfterSide - userBalanceBeforeSide====`, new BigNumber(userBalanceAfterSide).minus(userBalanceBeforeSide).toString())
                if (Object.keys(depositInfo).length > 0 && new BigNumber(userBalanceAfterSide).minus(userBalanceBeforeSide).toString() > 0) {
                    console.log('depositInfo:'+util.inspect(depositInfo))
                    break
                } else {
                    await wait(60)
                    continue
                }
            }

            // balance after deposit
            const userBalanceAfterMain = new BigNumber((await tronClient.balanceOfERC20(from, erc20MainToken, {parent:true}))._hex,16).toString()
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            userBalanceAfterSide = await tronClient.balanceOfERC20(from, erc20SideToken, {parent:false})
            console.log(`====userBalanceAfterSide====`, userBalanceAfterSide)
            assert.equal(new BigNumber(userBalanceBeforeMain).minus(userBalanceAfterMain).toString(), depositAmount)
            assert.equal(new BigNumber(userBalanceAfterSide).minus(userBalanceBeforeSide).toString(), depositAmount)

            const predicateBalanceAfterMain = new BigNumber((await tronClient.balanceOfERC20(erc20PredicateMain, erc20MainToken, {parent:true}))._hex,16).toString()
            console.log(`====predicateBalanceAfterMain====`, predicateBalanceAfterMain)
            console.log(`====predicateBalanceAfterMain - predicateBalanceBeforeMain====`, new BigNumber(predicateBalanceAfterMain).minus(predicateBalanceBeforeMain).toString())
        })
        it('burn', async function() {
            // balance before burn
            let userBalanceBeforeSide = await tronClient.balanceOfERC20(from, erc20SideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)

            // burn
            const withdrawAmount = 1e8
            const tx = await ethClient.burnERC20({ childToken: erc20SideToken, amount:withdrawAmount}, {
                from: from,
                gasPrice: 900000000000,
                gas: 300000,
                // value:withdrawAmount,// btt use
            })
            console.log(`====burnTx====`, tx)

            // balance after burn
            let userBalanceAfterSide = await tronClient.balanceOfERC20(from, erc20SideToken, {parent:false})
            console.log(`====userBalanceAfterSide====`, userBalanceAfterSide)
            assert.equal(new BigNumber(userBalanceBeforeSide).minus(userBalanceAfterSide).toString(), withdrawAmount)
            // assert.equal(new BigNumber(userBalanceBeforeSide).minus(userBalanceAfterSide).toString(), withdrawAmount+tx.gasUsed*900000000000) // btt use
            fs.writeFile('./burnRecord', '\ntron-trc20BurnHash: '+tx.transactionHash,{ 'flag': 'a' }, function(error) {
                if (error){
                    console.log('写入burn记录失败')
                }
            })
        })
        it('exit', async function() {
            // balance before exit
            let userBalanceBeforeMain = new BigNumber((await tronClient.balanceOfERC20(from, erc20MainToken, {parent:true}))._hex,16).toString()
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)

            // exit
            const withdrawAmount = 1e8
            const burnHash = '0x8da8dd736c33905c2e5c2ca0e6dcc4e279f129e8b126c53a7f9b978e028ce64f'
            const tx = await tronClient.exitERC20(burnHash,{
                from: from,
                legacyProof: true,
                parent: true,
            })
            console.log(`====exitTx====`, tx)

            // balance after exit
            const userBalanceAfterMain = new BigNumber((await tronClient.balanceOfERC20(from, erc20MainToken, {parent:true}))._hex,16).toString()
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            assert.equal(new BigNumber(userBalanceAfterMain).minus(userBalanceBeforeMain).toString(), withdrawAmount)
        })
    })
    // process.exit(0)
})