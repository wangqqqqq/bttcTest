const { contractOwnerETHBSC,user } = require('../utils/config')
const { write,find,remove } = require('../utils/publicMethods')
const { getBscClient, pos } = require('../utils/utils')
const BigNumber = require('bignumber.js')
const wait = require('../utils/wait')
const chai = require('chai')
const assert = chai.assert
const util = require('util')

const userPk = user.privateKey
const userAddr = user.address
let bscClient = getBscClient(userPk,userAddr)

const bnbSideToken = pos.BSC.bnbSide
const etherPredicateMain = pos.BSC.etherPredicate

describe('bsc bnb test', function() {
    this.timeout(2000000)
    const depositAmount = 1e8
    describe('#bnb', function() {
        it('deposit', async function() {
            // balance before deposit
            let userBalanceBeforeMain = await bscClient.balanceOfEther(userAddr,{parent:true})
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)
            let userBalanceBeforeSide = await bscClient.balanceOfERC20(userAddr, bnbSideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)
            const predicateBalanceBeforeMain = await bscClient.balanceOfEther(etherPredicateMain,{parent:true})
            console.log(`====predicateBalanceBeforeMain====`, predicateBalanceBeforeMain)

            // deposit
            const depositTx = await bscClient.depositEtherForUser(userAddr, depositAmount,{
                from:userAddr,
                gasPrice: 900000000000,
                gas: 300000,
            })
            console.log(`====depositTx====`, depositTx)
            let userBalanceAfterSide
            await wait(60)
            while (true) {
                userBalanceAfterSide = await bscClient.balanceOfERC20(userAddr, bnbSideToken, {parent:false})
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
            const userBalanceAfterMain = await bscClient.balanceOfEther(userAddr, {parent:true})
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            userBalanceAfterSide = await bscClient.balanceOfERC20(userAddr, bnbSideToken, {parent:false})
            console.log(`====userBalanceAfterSide====`, userBalanceAfterSide)
            assert.equal(new BigNumber(userBalanceBeforeMain).minus(userBalanceAfterMain).toString(), depositAmount+depositTx.gasUsed*900000000000)
            assert.equal(new BigNumber(userBalanceAfterSide).minus(userBalanceBeforeSide).toString(), depositAmount)

            const predicateBalanceAfterMain = await bscClient.balanceOfEther(etherPredicateMain, {parent:true})
            console.log(`====predicateBalanceAfterMain====`, predicateBalanceAfterMain)
            assert.equal(new BigNumber(predicateBalanceAfterMain).minus(predicateBalanceBeforeMain).toString(), depositAmount)
        })

        it('burn', async function() {
            let userBalanceBeforeSide = await bscClient.balanceOfERC20(userAddr, bnbSideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)

            // burn
            const tx = await bscClient.burnERC20({ childToken: bnbSideToken, withdrawTo: true, amount:depositAmount, to:userAddr}, {
                from: userAddr,
                gasPrice: 900000000000,
                gas: 300000,
            })
            console.log(`====burnTx====`, tx)

            // balance after burn
            let userBalanceAfterBurnSide = await bscClient.balanceOfERC20(userAddr, bnbSideToken, {parent:false})
            console.log(`====userBalanceAfterBurnSide====`, userBalanceAfterBurnSide)
            assert.equal(new BigNumber(userBalanceBeforeSide).minus(userBalanceAfterBurnSide).toString(), depositAmount)

            // write
            assert.equal(await write('bsc-bnbBurnHash:'+tx.transactionHash+',tokenAmount:'+depositAmount),true)
            process.exit(0)
        })

        it('exit', async function() {
            // balance before exit
            let userBalanceBeforeMain = await bscClient.balanceOfEther(userAddr,{parent:true})
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)

            // exit
            let map = await find('bsc-bnbBurnHash')
            const burnHash = map.get('hash')
            console.log("burnHash:"+burnHash)
            const tokenAmount = map.get('tokenAmount')
            const tx = await bscClient.exitERC20(burnHash,{
                from: userAddr,
                legacyProof: true,
                parent: true,
            })
            console.log(`====exitTx====`, tx)

            // balance after exit
            const userBalanceAfterMain = await bscClient.balanceOfEther(userAddr, {parent:true})
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