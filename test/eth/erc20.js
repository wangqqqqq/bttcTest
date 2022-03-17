const { contractOwnerETHBSC,user } = require('../utils/config')
const { write,find,remove } = require('../utils/publicMethods')
const { getEthClient, pos } = require('../utils/utils')
const BigNumber = require('bignumber.js')
const wait = require('../utils/wait')
const chai = require('chai')
const assert = chai.assert
const util = require('util')

const ethClientContractOwner = getEthClient(contractOwnerETHBSC.privateKey,contractOwnerETHBSC.address)
const userPk = user.privateKey
const userAddr = user.address
let ethClient = getEthClient(userPk,userAddr)

const erc20MainToken = pos.ETH.erc20Main
const erc20SideToken = pos.ETH.erc20Side
const erc20PredicateMain = pos.ETH.erc20Predicate
const merc20MainToken = pos.ETH.merc20Main
const merc20SideToken = pos.ETH.merc20Side
const merc20PredicateMain = pos.ETH.merc20Predicate

describe('eth erc20 test', function() {
    this.timeout(2000000)
    const depositAmount = 1e8
    describe('#no mintable token in mainChain', function() {
        it('deposit', async function() {
            // approve
            let allowance = await ethClient.getERC20Allowance(userAddr,erc20MainToken)
            if (allowance < depositAmount) {
                const result = await ethClient.approveMaxERC20ForDeposit(erc20MainToken, {from:userAddr})
                console.log('====approve-result===='+result)

                do{
                    await wait(20)
                    allowance = await ethClient.getERC20Allowance(userAddr,erc20MainToken)

                }while(allowance < depositAmount)
            }

            // balance before deposit
            let userBalanceBeforeMain = await ethClient.balanceOfERC20(userAddr, erc20MainToken, {parent:true})
            let ownerBalanceBefore = await ethClient.balanceOfERC20(contractOwnerETHBSC.address, erc20MainToken, {parent:true})
            if (userBalanceBeforeMain < depositAmount) {
                let ownerBalanceAfter
                const mintAmount = 1e20
                ethClientContractOwner.mintERC20Token(erc20MainToken,mintAmount,{from:contractOwnerETHBSC.address,parent:true})
                do{
                    await wait(20)
                    ownerBalanceAfter = await ethClient.balanceOfERC20(contractOwnerETHBSC.address, erc20MainToken, {parent:true})
                }while(ownerBalanceAfter == ownerBalanceBefore)

                // transfer
                await ethClientContractOwner.transferERC20Tokens(erc20MainToken, userAddr, mintAmount, {from:contractOwnerETHBSC.address, parent:true})
                do{
                    await wait(20)
                    userBalanceBeforeMain = await ethClient.balanceOfERC20(userAddr, erc20MainToken, {parent:true})

                }while(userBalanceBeforeMain < depositAmount)
            }
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)
            let userBalanceBeforeSide = await ethClient.balanceOfERC20(userAddr, erc20SideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)
            const predicateBalanceBeforeMain = await ethClient.balanceOfERC20(erc20PredicateMain, erc20MainToken, {parent:true})
            console.log(`====predicateBalanceBeforeMain====`, predicateBalanceBeforeMain)

            // deposit
            const depositTx = await ethClient.depositERC20ForUser(erc20MainToken, userAddr, depositAmount)
            console.log(`====depositTx====`, depositTx)
            let userBalanceAfterSide
            await wait(60)
            while (true) {
                userBalanceAfterSide = await ethClient.balanceOfERC20(userAddr, erc20SideToken, {parent:false})
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
            const userBalanceAfterMain = await ethClient.balanceOfERC20(userAddr, erc20MainToken, {parent:true})
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            userBalanceAfterSide = await ethClient.balanceOfERC20(userAddr, erc20SideToken, {parent:false})
            console.log(`====userBalanceAfterSide====`, userBalanceAfterSide)
            assert.equal(new BigNumber(userBalanceBeforeMain).minus(userBalanceAfterMain).toString(), depositAmount)
            assert.equal(new BigNumber(userBalanceAfterSide).minus(userBalanceBeforeSide).toString(), depositAmount)

            const predicateBalanceAfterMain = await ethClient.balanceOfERC20(erc20PredicateMain, erc20MainToken, {parent:true})
            console.log(`====predicateBalanceAfterMain====`, predicateBalanceAfterMain)
            assert.equal(new BigNumber(predicateBalanceAfterMain).minus(predicateBalanceBeforeMain).toString(), depositAmount)
        })
        it('burn', async function() {
            let userBalanceBeforeSide = await ethClient.balanceOfERC20(userAddr, erc20SideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)

            // burn
            const tx = await ethClient.burnERC20({ childToken: erc20SideToken, withdrawTo: true, amount:depositAmount, to:userAddr}, {
                from: userAddr,
                gasPrice: 900000000000,
                gas: 300000,
            })
            console.log(`====burnTx====`, tx)

            // balance after burn
            let userBalanceAfterBurnSide = await ethClient.balanceOfERC20(userAddr, erc20SideToken, {parent:false})
            console.log(`====userBalanceAfterBurnSide====`, userBalanceAfterBurnSide)
            assert.equal(new BigNumber(userBalanceBeforeSide).minus(userBalanceAfterBurnSide).toString(), depositAmount)

            // write
            assert.equal(await write('eth-erc20BurnHash:'+tx.transactionHash+',tokenAmount:'+depositAmount),true)
        })
        it('exit', async function() {
            // balance before exit
            let userBalanceBeforeMain = await ethClient.balanceOfERC20(userAddr, erc20MainToken, {parent:true})
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)

            // exit
            let map = await find('eth-erc20BurnHash')
            const burnHash = map.get('hash')
            console.log("burnHash:"+burnHash)
            const tokenAmount = map.get('tokenAmount')
            const tx = await ethClient.exitERC20(burnHash,{
                from: userAddr,
                legacyProof: true,
                parent: true,
            })
            console.log(`====exitTx====`, tx)

            // balance after exit
            const userBalanceAfterMain = await ethClient.balanceOfERC20(userAddr, erc20MainToken, {parent:true})
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            assert.equal(new BigNumber(userBalanceAfterMain).minus(userBalanceBeforeMain).toString(), tokenAmount)

            // remove
            assert.equal(await remove(burnHash),true)
        })
    })
    describe('#mintable token in mainChain', function () {
        it('deposit', async function() {
            // approve
            let allowance = await ethClient.getERC20Allowance(userAddr,merc20MainToken)
            if (allowance < depositAmount) {
                const result = await ethClient.approveMaxERC20ForDeposit(merc20MainToken, {from:userAddr})
                console.log('====approve-result===='+result)

                do{
                    await wait(20)
                    allowance = await ethClient.getERC20Allowance(userAddr,merc20MainToken)

                }while(allowance < depositAmount)
            }

            // balance before deposit
            let userBalanceBeforeMain = await ethClient.balanceOfERC20(userAddr, merc20MainToken, {parent:true})
            if (userBalanceBeforeMain < depositAmount) {
                const mintAmount = 1e20
                ethClientContractOwner.mintERC20TokenTo(merc20MainToken, userAddr, mintAmount,{from:contractOwnerETHBSC.address, parent:true})
                do{
                    await wait(20)
                    userBalanceBeforeMain = await ethClient.balanceOfERC20(userAddr, merc20MainToken, {parent:true})
                }while(userBalanceBeforeMain < depositAmount)
            }
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)
            let userBalanceBeforeSide = await ethClient.balanceOfERC20(userAddr, merc20SideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)
            const predicateBalanceBeforeMain = await ethClient.balanceOfERC20(merc20PredicateMain, merc20MainToken, {parent:true})
            console.log(`====predicateBalanceBeforeMain====`, predicateBalanceBeforeMain)

            // deposit
            const depositTx = await ethClient.depositERC20ForUser(merc20MainToken, userAddr, depositAmount)
            console.log(`====depositTx====`, depositTx)
            let userBalanceAfterSide
            await wait(60)
            while (true) {
                userBalanceAfterSide = await ethClient.balanceOfERC20(userAddr, merc20SideToken, {parent:false})
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
            const userBalanceAfterMain = await ethClient.balanceOfERC20(userAddr, merc20MainToken, {parent:true})
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            userBalanceAfterSide = await ethClient.balanceOfERC20(userAddr, merc20SideToken, {parent:false})
            console.log(`====userBalanceAfterSide====`, userBalanceAfterSide)
            assert.equal(new BigNumber(userBalanceBeforeMain).minus(userBalanceAfterMain).toString(), depositAmount)
            assert.equal(new BigNumber(userBalanceAfterSide).minus(userBalanceBeforeSide).toString(), depositAmount)

            const predicateBalanceAfterMain = await ethClient.balanceOfERC20(merc20PredicateMain, merc20MainToken, {parent:true})
            console.log(`====predicateBalanceAfterMain====`, predicateBalanceAfterMain)
            assert.equal(new BigNumber(predicateBalanceAfterMain).minus(predicateBalanceBeforeMain).toString(), depositAmount)
        })
        it('burn', async function() {
            let userBalanceBeforeSide = await ethClient.balanceOfERC20(userAddr, merc20SideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)

            // burn
            const tx = await ethClient.burnERC20({ childToken: merc20SideToken, withdrawTo: true, amount:depositAmount, to:userAddr}, {
                from: userAddr,
                gasPrice: 900000000000,
                gas: 300000,
            })
            console.log(`====burnTx====`, tx)

            // balance after burn
            let userBalanceAfterBurnSide = await ethClient.balanceOfERC20(userAddr, merc20SideToken, {parent:false})
            console.log(`====userBalanceAfterBurnSide====`, userBalanceAfterBurnSide)
            assert.equal(new BigNumber(userBalanceBeforeSide).minus(userBalanceAfterBurnSide).toString(), depositAmount)

            // write
            assert.equal(await write('eth-merc20BurnHash:'+tx.transactionHash+',tokenAmount:'+depositAmount),true)
        })
        it('exit', async function() {
            // balance before exit
            let userBalanceBeforeMain = await ethClient.balanceOfERC20(userAddr, merc20MainToken, {parent:true})
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)

            // exit
            let map = await find('eth-merc20BurnHash')
            const burnHash = map.get('hash')
            console.log("burnHash:"+burnHash)
            const tokenAmount = map.get('tokenAmount')
            const tx = await ethClient.exitERC20(burnHash,{
                from: userAddr,
                legacyProof: true,
                parent: true,
            })
            console.log(`====exitTx====`, tx)

            // balance after exit
            const userBalanceAfterMain = await ethClient.balanceOfERC20(userAddr, merc20MainToken, {parent:true})
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