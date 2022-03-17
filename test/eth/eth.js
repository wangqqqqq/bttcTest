const { write,find,remove } = require('../utils/publicMethods')
const { getEthClient, pos } = require('../utils/utils')
const { user } = require('../utils/config')
const BigNumber = require('bignumber.js')
const wait = require('../utils/wait')
const util = require('util')
const chai = require('chai')
const assert = chai.assert

const userPk = user.privateKey
const userAddr = user.address
let ethClient = getEthClient(userPk,userAddr)

const ethSideToken = pos.ETH.ethSide
const etherPredicateMain = pos.ETH.etherPredicate

describe('eth eth test', function() {
    this.timeout(2000000)
    describe('#eth', function() {
        const depositAmount = 1e8
        it('deposit', async function() {
            // balance before deposit
            let userBalanceBeforeMain = await ethClient.balanceOfEther(userAddr,{parent:true})
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)
            let userBalanceBeforeSide = await ethClient.balanceOfERC20(userAddr, ethSideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)
            const predicateBalanceBeforeMain = await ethClient.balanceOfEther(etherPredicateMain,{parent:true})
            console.log(`====predicateBalanceBeforeMain====`, predicateBalanceBeforeMain)

            // deposit
            const depositTx = await ethClient.depositEtherForUser(userAddr, depositAmount,{
                from:userAddr,
                gasPrice: 900000000000,
                gas: 300000,
            })
            console.log(`====depositTx====`, depositTx)
            let userBalanceAfterSide
            await wait(60)
            while (true) {
                userBalanceAfterSide = await ethClient.balanceOfERC20(userAddr, ethSideToken, {parent:false})
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
            const userBalanceAfterMain = await ethClient.balanceOfEther(userAddr, {parent:true})
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            userBalanceAfterSide = await ethClient.balanceOfERC20(userAddr, ethSideToken, {parent:false})
            console.log(`====userBalanceAfterSide====`, userBalanceAfterSide)
            assert.equal(new BigNumber(userBalanceBeforeMain).minus(userBalanceAfterMain).toString(), depositAmount+depositTx.gasUsed*900000000000)
            assert.equal(new BigNumber(userBalanceAfterSide).minus(userBalanceBeforeSide).toString(), depositAmount)

            const predicateBalanceAfterMain = await ethClient.balanceOfEther(etherPredicateMain, {parent:true})
            console.log(`====predicateBalanceAfterMain====`, predicateBalanceAfterMain)
            assert.equal(new BigNumber(predicateBalanceAfterMain).minus(predicateBalanceBeforeMain).toString(), depositAmount)
        })
        it('burn', async function() {
            let userBalanceBeforeSide = await ethClient.balanceOfERC20(userAddr, ethSideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)

            // burn
            const tx = await ethClient.burnERC20({childToken: ethSideToken, withdrawTo: true, amount:depositAmount, to:userAddr}, {
                from: userAddr,
                gasPrice: 900000000000,
                gas: 300000,
            })
            console.log(`====burnTx====`, tx)

            // balance after burn
            let userBalanceAfterBurnSide = await ethClient.balanceOfERC20(userAddr, ethSideToken, {parent:false})
            console.log(`====userBalanceAfterBurnSide====`, userBalanceAfterBurnSide)
            assert.equal(new BigNumber(userBalanceBeforeSide).minus(userBalanceAfterBurnSide).toString(), depositAmount)

            // write
            assert.equal(await write('eth-ethBurnHash:'+tx.transactionHash+',tokenAmount:'+depositAmount),true)
        })
        it('exit', async function() {
            // balance before exit
            let userBalanceBeforeMain = await ethClient.balanceOfEther(userAddr,{parent:true})
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)

            // exit
            let map = await find('eth-ethBurnHash')
            const burnHash = map.get('hash')
            console.log("burnHash:"+burnHash)
            const tokenAmount = map.get('tokenAmount')
            const tx = await ethClient.exitERC20(burnHash,{
                from: userAddr,
                legacyProof: true,
                parent: true,
                gasPrice: 900000000000,
                gas: 300000,
            })
            console.log(`====exitTx====`, tx)

            // balance after exit
            const userBalanceAfterMain = await ethClient.balanceOfEther(userAddr, {parent:true})
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            assert.equal(new BigNumber(userBalanceAfterMain).minus(userBalanceBeforeMain).toString(), tokenAmount-tx.gasUsed*900000000000)

            // remove
            assert.equal(await remove(burnHash),true)
        })
    })
    after(async function () {
        process.exit()
    })
})