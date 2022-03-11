const { getEthClient, getTronWebInstance, from, pos } = require('../utils/utils')
const {subtract, evaluate, log, pi, pow, round, sqrt} = require('mathjs')
const BigNumber = require('bignumber.js')
const wait = require('../utils/wait')
const chai = require('chai')
const assert = chai.assert
const util = require('util')
var web3 = require('web3')
var fs = require('fs')

const ethClient = getEthClient()
const tronWeb = getTronWebInstance()

const erc20MainToken = pos.ETH.erc20Main
const erc20SideToken = pos.ETH.erc20Side
const erc20PredicateMain = pos.ETH.erc20Predicate
const approveAmount = '9999999999999999999999'

describe('eth erc20 test', function() {
    this.timeout(1000000)
    describe('#mintable<-->no mintable', function() {
        it('deposit', async function() {
            // // approve
            // transaction = await tronWeb.transactionBuilder.triggerConstantContract(erc20MainToken.replace('0x', '41'), 'allowance(address,address)', {},
            //     [{type: 'address', value: from.replace('0x', '41')},{type: 'address', value: erc20PredicateMain.replace('0x', '41')}], from.replace('0x', '41'))
            // if (tronWeb.BigNumber(transaction.constant_result, 16) < 100) {
                const result = await ethClient.approveERC20ForDeposit(erc20MainToken, approveAmount, { from })
                console.log('====approve-result===='+result)
                await wait(10)
            // }

            // balance before deposit
            let userBalanceBeforeMain = await ethClient.balanceOfERC20(from, erc20MainToken, {parent:true})
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)
            let userBalanceBeforeSide = await ethClient.balanceOfERC20(from, erc20SideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)
            const predicateBalanceBeforeMain = await ethClient.balanceOfERC20(erc20PredicateMain, erc20MainToken, {parent:true})
            console.log(`====predicateBalanceBeforeMain====`, predicateBalanceBeforeMain)

            // deposit
            const depositAmount = 100000000
            const depositTx = await ethClient.depositERC20ForUser(erc20MainToken, from, depositAmount)
            console.log(`====depositTx====`, depositTx)
            let depositInfo
            let userBalanceAfterSide
            await wait(60)
            while (true) {
                const depositReceipt = ethClient.web3Client.getParentWeb3().eth.getTransactionReceipt(depositTx.transactionHash)
                console.log(`====depositReceipt====`, depositReceipt)
                if (!depositReceipt) {
                    throw new Error('Transaction hash not found')
                }
                userBalanceAfterSide = await ethClient.balanceOfERC20(from, erc20SideToken, {parent:false})
                console.log(`====userBalanceAfterSide====`, userBalanceAfterSide)
                console.log(`====userBalanceAfterSide - userBalanceBeforeSide====`, new BigNumber(userBalanceAfterSide).minus(userBalanceBeforeSide).toString())
                if (new BigNumber(userBalanceAfterSide).minus(userBalanceBeforeSide).toString() > 0) {
                    break
                } else {
                    await wait(60)
                    continue
                }
            }

            // balance after deposit
            const userBalanceAfterMain = await ethClient.balanceOfERC20(from, erc20MainToken, {parent:true})
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            userBalanceAfterSide = await ethClient.balanceOfERC20(from, erc20SideToken, {parent:false})
            console.log(`====userBalanceAfterSide====`, userBalanceAfterSide)
            assert.equal(new BigNumber(userBalanceBeforeMain).minus(userBalanceAfterMain).toString(), depositAmount)
            assert.equal(new BigNumber(userBalanceAfterSide).minus(userBalanceBeforeSide).toString(), depositAmount)

            const predicateBalanceAfterMain = await ethClient.balanceOfERC20(erc20PredicateMain, erc20MainToken, {parent:true})
            console.log(`====predicateBalanceAfterMain====`, predicateBalanceAfterMain)
            console.log(`====predicateBalanceAfterMain - predicateBalanceBeforeMain====`, new BigNumber(predicateBalanceAfterMain).minus(predicateBalanceBeforeMain).toString())
        })
        it('burn', async function() {
            // balance before burn
            let userBalanceBeforeSide = await ethClient.balanceOfERC20(from, erc20SideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)

            // burn
            const withdrawAmount = 1e8
            const tx = await ethClient.burnERC20({ childToken: erc20SideToken, amount:withdrawAmount}, {
                from: from,
                gasPrice: 900000000000,
                gas: 300000,
            })
            console.log(`====burnTx====`, tx)

            // balance after burn
            let userBalanceAfterSide = await ethClient.balanceOfERC20(from, erc20SideToken, {parent:false})
            console.log(`====userBalanceAfterSide====`, userBalanceAfterSide)
            assert.equal(new BigNumber(userBalanceBeforeSide).minus(userBalanceAfterSide).toString(), withdrawAmount)
            fs.writeFile('./burnRecord', '\n\reth-erc20BurnHash: '+tx.transactionHash,{ 'flag': 'a' }, function(error) {
                if (error){
                    console.log('写入burn记录失败')
                }
            })
        })
        it('exit', async function() {
            // balance before exit
            let userBalanceBeforeMain = await ethClient.balanceOfERC20(from, erc20MainToken, {parent:true})
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)

            // exit
            const withdrawAmount = 1e8
            const burnHash = '0x3b485e95614fa0bca6e0da5824d3c186efeb5379dca17235168d51a8e7f9fa2e'
            const tx = await ethClient.exitERC20(burnHash,{
                from: from,
                legacyProof: true,
                parent: true,
            })
            console.log(`====exitTx====`, tx)

            // balance after exit
            const userBalanceAfterMain = await ethClient.balanceOfERC20(from, erc20MainToken, {parent:true})
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            assert.equal(new BigNumber(userBalanceAfterMain).minus(userBalanceBeforeMain).toString(), withdrawAmount)
        })
    })
    // process.exit(0)
})