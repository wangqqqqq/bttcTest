const { getTronWebClient, getEthClient, getTronWebInstance, pos } = require('../utils/utils')
const { write,find,remove } = require('../utils/publicMethods')
const { contractOwnerTRON,user } = require('../utils/config')
const BigNumber = require('bignumber.js')
const wait = require('../utils/wait')
const chai = require('chai')
const assert = chai.assert
const util = require('util')

const tronClientContractOwner = getTronWebClient(contractOwnerTRON.privateKey,contractOwnerTRON.address)
const userPk = user.privateKey
const userAddr = user.address
const tronClient = getTronWebClient(userPk,userAddr)
let ethClient = getEthClient(userPk,userAddr)
const tronWeb = getTronWebInstance()

const erc20MainToken = pos.TRON.erc20Main
const erc20SideToken = pos.TRON.erc20Side
const erc20PredicateMain = pos.TRON.erc20Predicate
const merc20MainToken = pos.TRON.merc20Main
const merc20SideToken = pos.TRON.merc20Side
const merc20PredicateMain = pos.TRON.merc20Predicate

describe('tron erc20 test', function() {
    this.timeout(2000000)
    const depositAmount = 1e8
    describe('#no mintable token in mainChain', function() {
        it('deposit', async function() {
            // approve
            let allowance = await tronClient.getERC20Allowance(userAddr, erc20MainToken)
            if (allowance < depositAmount) {
                const result = await tronClient.approveMaxERC20ForDeposit(erc20MainToken, {from:userAddr})
                console.log('====approve-result===='+result)

                do{
                    await wait(20)
                    allowance = await tronClient.getERC20Allowance(userAddr,erc20MainToken)

                }while(allowance < depositAmount)
            }

            // balance before deposit
            console.log("111")
            let userBalanceBeforeMain = new BigNumber((await tronClient.balanceOfERC20(userAddr, erc20MainToken, {parent:true}))._hex,16).toString()
            let ownerBalanceBefore = new BigNumber((await tronClient.balanceOfERC20(contractOwnerTRON.address, erc20MainToken, {parent:true}))._hex,16).toString()
            if (userBalanceBeforeMain < depositAmount) {
                console.log("222")
                let ownerBalanceAfter
                const mintAmount = '100000000000000000000'
                const result = await tronClientContractOwner.mintERC20Tokens(erc20MainToken, mintAmount, {from:contractOwnerTRON.address})
                console.log('====mint-result===='+result)
            console.log("333")
                do {
                    await wait(10)
                    ownerBalanceAfter = new BigNumber((await tronClient.balanceOfERC20(contractOwnerTRON.address, erc20MainToken, {parent:true}))._hex,16).toString()
                } while (ownerBalanceAfter == ownerBalanceBefore)

                // transfer
                await tronClientContractOwner.transferERC20Tokens(erc20MainToken, userAddr, mintAmount, {from:contractOwnerTRON.address, parent:true})
                do{
                    await wait(20)
                    userBalanceBeforeMain = new BigNumber((await tronClient.balanceOfERC20(userAddr, erc20MainToken, {parent:true}))._hex,16).toString()

                }while(userBalanceBeforeMain < depositAmount)
            }

            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)
            let userBalanceBeforeSide = await tronClient.balanceOfERC20(userAddr, erc20SideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)
            const predicateBalanceBeforeMain = new BigNumber((await tronClient.balanceOfERC20(erc20PredicateMain, erc20MainToken, {parent:true}))._hex,16).toString()
            console.log(`====predicateBalanceBeforeMain====`, predicateBalanceBeforeMain)

            // deposit
            const depositTx = await tronClient.depositERC20ForUser(erc20MainToken, userAddr, depositAmount)
            console.log(`====depositTx====`, depositTx)
            let depositInfo
            let userBalanceAfterSide
            await wait(60)
            while (true) {
                depositInfo = await tronWeb.trx.getTransactionInfo(depositTx)
                userBalanceAfterSide = await tronClient.balanceOfERC20(userAddr, erc20SideToken, {parent:false})
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
            const userBalanceAfterMain = new BigNumber((await tronClient.balanceOfERC20(userAddr, erc20MainToken, {parent:true}))._hex,16).toString()
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            userBalanceAfterSide = await tronClient.balanceOfERC20(userAddr, erc20SideToken, {parent:false})
            console.log(`====userBalanceAfterSide====`, userBalanceAfterSide)
            assert.equal(new BigNumber(userBalanceBeforeMain).minus(userBalanceAfterMain).toString(), depositAmount)
            assert.equal(new BigNumber(userBalanceAfterSide).minus(userBalanceBeforeSide).toString(), depositAmount)

            const predicateBalanceAfterMain = new BigNumber((await tronClient.balanceOfERC20(erc20PredicateMain, erc20MainToken, {parent:true}))._hex,16).toString()
            console.log(`====predicateBalanceAfterMain====`, predicateBalanceAfterMain)
            assert.equal(new BigNumber(predicateBalanceAfterMain).minus(predicateBalanceBeforeMain).toString(), depositAmount)
        })
        it('burn', async function() {
            // balance before burn
            let userBalanceBeforeSide = await tronClient.balanceOfERC20(userAddr, erc20SideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)

            // burn
            const tx = await ethClient.burnERC20({ childToken: erc20SideToken, withdrawTo: true, amount:depositAmount, to:userAddr}, {
                from: userAddr,
                gasPrice: 900000000000,
                gas: 300000,
                // value:withdrawAmount,// btt use
            })
            console.log(`====burnTx====`, tx)

            // balance after burn
            let userBalanceAfterSide = await tronClient.balanceOfERC20(userAddr, erc20SideToken, {parent:false})
            console.log(`====userBalanceAfterSide====`, userBalanceAfterSide)
            assert.equal(new BigNumber(userBalanceBeforeSide).minus(userBalanceAfterSide).toString(), depositAmount)
            // assert.equal(new BigNumber(userBalanceBeforeSide).minus(userBalanceAfterSide).toString(), withdrawAmount+tx.gasUsed*900000000000) // btt use

            // write
            assert.equal(await write('tron-trc20BurnHash:'+tx.transactionHash+',tokenAmount:'+depositAmount),true)
        })
        it('exit', async function() {
            // balance before exit
            let userBalanceBeforeMain = new BigNumber((await tronClient.balanceOfERC20(userAddr, erc20MainToken, {parent:true}))._hex,16).toString()
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)

            // exit
            let map = await find('tron-trc20BurnHash')
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
            const userBalanceAfterMain = new BigNumber((await tronClient.balanceOfERC20(userAddr, erc20MainToken, {parent:true}))._hex,16).toString()
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            assert.equal(new BigNumber(userBalanceAfterMain).minus(userBalanceBeforeMain).toString(), tokenAmount)

            // remove
            assert.equal(await remove(burnHash),true)
        })
    })
    describe('#mintable token in mainChain', function() {
        it('deposit', async function() {
            // approve
            let allowance = await tronClient.getERC20Allowance(userAddr, merc20MainToken)
            if (allowance < depositAmount) {
                const result = await tronClient.approveMaxERC20ForDeposit(merc20MainToken, {from:userAddr})
                console.log('====approve-result===='+result)

                do{
                    await wait(20)
                    allowance = await tronClient.getERC20Allowance(userAddr,merc20MainToken)

                }while(allowance < depositAmount)
            }

            // balance before deposit
            let userBalanceBeforeMain = new BigNumber((await tronClient.balanceOfERC20(userAddr, merc20MainToken, {parent:true}))._hex,16).toString()
            if (userBalanceBeforeMain < depositAmount) {
                const mintAmount = '100000000000000000000'
                const result = await tronClientContractOwner.mintERC20TokensTo(merc20MainToken, userAddr, mintAmount, {from:contractOwnerTRON.address})
                console.log('====mint-result===='+result)
                do {
                    await wait(10)
                    userBalanceBeforeMain = new BigNumber((await tronClient.balanceOfERC20(userAddr, merc20MainToken, {parent:true}))._hex,16).toString()
                } while (userBalanceBeforeMain < depositAmount)
            }
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)
            let userBalanceBeforeSide = await tronClient.balanceOfERC20(userAddr, merc20SideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)
            const predicateBalanceBeforeMain = new BigNumber((await tronClient.balanceOfERC20(merc20PredicateMain, merc20MainToken, {parent:true}))._hex,16).toString()
            console.log(`====predicateBalanceBeforeMain====`, predicateBalanceBeforeMain)

            // deposit
            const depositTx = await tronClient.depositERC20ForUser(merc20MainToken, userAddr, depositAmount)
            console.log(`====depositTx====`, depositTx)
            let depositInfo
            let userBalanceAfterSide
            await wait(60)
            while (true) {
                depositInfo = await tronWeb.trx.getTransactionInfo(depositTx)
                userBalanceAfterSide = await tronClient.balanceOfERC20(userAddr, merc20SideToken, {parent:false})
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
            const userBalanceAfterMain = new BigNumber((await tronClient.balanceOfERC20(userAddr, merc20MainToken, {parent:true}))._hex,16).toString()
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            userBalanceAfterSide = await tronClient.balanceOfERC20(userAddr, merc20SideToken, {parent:false})
            console.log(`====userBalanceAfterSide====`, userBalanceAfterSide)
            assert.equal(new BigNumber(userBalanceBeforeMain).minus(userBalanceAfterMain).toString(), depositAmount)
            assert.equal(new BigNumber(userBalanceAfterSide).minus(userBalanceBeforeSide).toString(), depositAmount)

            const predicateBalanceAfterMain = new BigNumber((await tronClient.balanceOfERC20(merc20PredicateMain, merc20MainToken, {parent:true}))._hex,16).toString()
            console.log(`====predicateBalanceAfterMain====`, predicateBalanceAfterMain)
            assert.equal(new BigNumber(predicateBalanceAfterMain).minus(predicateBalanceBeforeMain).toString(), depositAmount)
        })
        it('burn', async function() {
            // balance before burn
            let userBalanceBeforeSide = await tronClient.balanceOfERC20(userAddr, merc20SideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)

            // burn
            const tx = await ethClient.burnERC20({ childToken: merc20SideToken, withdrawTo: true, amount:depositAmount, to:userAddr}, {
                from: userAddr,
                gasPrice: 900000000000,
                gas: 300000,
                // value:withdrawAmount,// btt use
            })
            console.log(`====burnTx====`, tx)

            // balance after burn
            let userBalanceAfterSide = await tronClient.balanceOfERC20(userAddr, merc20SideToken, {parent:false})
            console.log(`====userBalanceAfterSide====`, userBalanceAfterSide)
            assert.equal(new BigNumber(userBalanceBeforeSide).minus(userBalanceAfterSide).toString(), depositAmount)
            // assert.equal(new BigNumber(userBalanceBeforeSide).minus(userBalanceAfterSide).toString(), withdrawAmount+tx.gasUsed*900000000000) // btt use

            // write
            assert.equal(await write('tron-mtrc20BurnHash:'+tx.transactionHash+',tokenAmount:'+depositAmount),true)
        })
        it('exit', async function() {
            // balance before exit
            let userBalanceBeforeMain = new BigNumber((await tronClient.balanceOfERC20(userAddr, merc20MainToken, {parent:true}))._hex,16).toString()
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)

            // exit
            let map = await find('tron-mtrc20BurnHash')
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
            const userBalanceAfterMain = new BigNumber((await tronClient.balanceOfERC20(userAddr, merc20MainToken, {parent:true}))._hex,16).toString()
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