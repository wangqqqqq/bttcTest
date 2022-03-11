const { getBscClient, pos } = require('../utils/utils')
const { contractOwnerETHBSC,user } = require('../utils/config')
const {subtract, evaluate, log, pi, pow, round, sqrt} = require('mathjs')
const BigNumber = require('bignumber.js')
const wait = require('../utils/wait')
const chai = require('chai')
const assert = chai.assert
const util = require('util')
var fs = require('fs')

const userAddr = user.address
const userPk = user.privateKey
const bscClient = getBscClient(userPk,userAddr)
const bscClientContractOwner = getBscClient(contractOwnerETHBSC.privateKey,contractOwnerETHBSC.address)

const erc721MainToken = pos.BSC.erc721Main
const erc721SideToken = pos.BSC.erc721Side
const erc721PredicateMain = pos.BSC.erc721Predicate
const merc721MainToken = pos.BSC.merc721Main
const merc721SideToken = pos.BSC.merc721Side
const merc721PredicateMain = pos.BSC.merc721Predicate

describe('bsc erc721 test', function() {
    this.timeout(1000000)
    describe('#no mint', function() {
        const tokenId = '1003'
        it('deposit', async function() {
            // balance before deposit
            let userBalanceBeforeMain = await bscClient.balanceOfERC721(userAddr, erc721MainToken, {parent:true})
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)
            if (userBalanceBeforeMain == 0){
                let ownerBalanceBefore = await bscClient.balanceOfERC721(contractOwnerETHBSC.address, erc721MainToken, {parent:true})
                let ownerBalanceAfter
                // mint
                await bscClientContractOwner.mintERC721Token(erc721MainToken,tokenId,{from:contractOwnerETHBSC.address, parent:true})
                do{
                    await wait(30)
                    ownerBalanceAfter = await bscClient.balanceOfERC721(contractOwnerETHBSC.address, erc721MainToken, {parent:true})
                }while(ownerBalanceAfter-ownerBalanceBefore == 0)

                // transfer
                await bscClientContractOwner.transferERC721Tokens(erc721MainToken, userAddr, tokenId, {from:contractOwnerETHBSC.address, parent:true})

                do{
                    await wait(30)
                    userBalanceBeforeMain = await bscClient.balanceOfERC721(userAddr, erc721MainToken, {parent:true})
                }while(userBalanceBeforeMain == 0)
            }
            let userBalanceBeforeSide = await bscClient.balanceOfERC721(userAddr, erc721SideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)
            const predicateBalanceBeforeMain = await bscClient.balanceOfERC721(erc721PredicateMain, erc721MainToken, {parent:true})
            console.log(`====predicateBalanceBeforeMain====`, predicateBalanceBeforeMain)

            // approve
            let isApproved = await bscClient.isApprovedERC721ForDeposit(erc721MainToken, tokenId, {from:userAddr})
            if (!isApproved) {
                await bscClient.approveERC721ForDeposit(erc721MainToken, tokenId, {from:userAddr})
                do{
                    await wait(20)
                    isApproved = await bscClient.isApprovedERC721ForDeposit(erc721MainToken, tokenId, {from:userAddr})
                }while(!isApproved)
            }

            // deposit
            const depositTx = await bscClient.depositERC721ForUser(erc721MainToken, userAddr, tokenId)
            console.log(`====depositTx====`, depositTx)
            let depositInfo
            let userBalanceAfterSide
            await wait(60)
            while (true) {
                const depositReceipt = bscClient.web3Client.getParentWeb3().eth.getTransactionReceipt(depositTx.transactionHash)
                console.log(`====depositReceipt====`, depositReceipt)
                userBalanceAfterSide = await bscClient.balanceOfERC721(userAddr, erc721SideToken, {parent:false})
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
            const userBalanceAfterMain = await bscClient.balanceOfERC721(userAddr, erc721MainToken, {parent:true})
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            userBalanceAfterSide = await bscClient.balanceOfERC721(userAddr, erc721SideToken, {parent:false})
            console.log(`====userBalanceAfterSide====`, userBalanceAfterSide)
            assert.equal(new BigNumber(userBalanceBeforeMain).minus(userBalanceAfterMain).toString(), 1)
            assert.equal(new BigNumber(userBalanceAfterSide).minus(userBalanceBeforeSide).toString(), 1)

            const predicateBalanceAfterMain = await bscClient.balanceOfERC721(erc721PredicateMain, erc721MainToken, {parent:true})
            console.log(`====predicateBalanceAfterMain====`, predicateBalanceAfterMain)
            console.log(`====predicateBalanceAfterMain - predicateBalanceBeforeMain====`, new BigNumber(predicateBalanceAfterMain).minus(predicateBalanceBeforeMain).toString())

            const ownerOfAfterMain = await bscClient.ownerOfERC721(erc721MainToken, tokenId, {parent:true})
            console.log(`====ownerOfAfterMain====`, ownerOfAfterMain)
            const ownerOfAfterSide = await bscClient.ownerOfERC721(erc721SideToken, tokenId, {parent:false})
            console.log(`====ownerOfAfterSide====`, ownerOfAfterSide)
            assert.equal(ownerOfAfterMain.toLowerCase(), erc721PredicateMain.toLowerCase())
            assert.equal(ownerOfAfterSide, userAddr)

        })
        it('burn', async function() {
            // balance before burn
            let userBalanceBeforeSide = await bscClient.balanceOfERC721(userAddr, erc721SideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)

            // burn
            const tx = await bscClient.burnERC721({ childToken: erc721SideToken, tokenId:tokenId}, {
                from: userAddr,
                gasPrice: 900000000000,
                gas: 300000,
            })
            console.log(`====burnTx====`, tx)

            // balance after burn
            let userBalanceAfterSide = await bscClient.balanceOfERC721(userAddr, erc721SideToken, {parent:false})
            console.log(`====userBalanceAfterSide====`, userBalanceAfterSide)
            assert.equal(new BigNumber(userBalanceBeforeSide).minus(userBalanceAfterSide).toString(), 1)

            fs.writeFile('./burnRecord', '\nbsc-erc721BurnHash: '+tx.transactionHash,{ 'flag': 'a' }, function(error) {
                if (error){
                    console.log('写入burn记录失败')
                }
            })
        })
        it('exit', async function() {
            // balance before exit
            let userBalanceBeforeMain = await bscClient.balanceOfERC721(userAddr, erc721MainToken, {parent:true})
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)

            // exit
            const burnHash = '0xd1ec8d5442dba4713f8289cd26ef1b653981caadce058c975a4435c3517273ce'
            const tx = await bscClient.burnERC721(burnHash,{
                from: userAddr,
                legacyProof: true,
                parent: true,
            })
            console.log(`====exitTx====`, tx)

            // balance after exit
            const userBalanceAfterMain = await bscClient.balanceOfERC721(userAddr, erc721MainToken, {parent:true})
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            assert.equal(new BigNumber(userBalanceAfterMain).minus(userBalanceBeforeMain).toString(), 1)
            const ownerOfAfterMain = await bscClient.ownerOfERC721(erc721MainToken, tokenId, {parent:true})
            console.log(`====ownerOfAfterMain====`, ownerOfAfterMain)
            assert.equal(ownerOfAfterMain.substr(2), userAddr.toLowerCase().substr(2))
        })
    })
    describe('#mint', function() {
        const tokenId = '1003'
        it('deposit', async function() {
            // balance before deposit
            let userBalanceBeforeMain = await bscClient.balanceOfERC721(userAddr, merc721MainToken, {parent:true})
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)
            if (userBalanceBeforeMain == 0){
                let ownerBalanceBefore = await bscClient.balanceOfERC721(contractOwnerETHBSC.address, merc721MainToken, {parent:true})
                let ownerBalanceAfter
                // mint
                await bscClientContractOwner.mintERC721TokenTo(merc721MainToken,userAddr,tokenId,{from:contractOwnerETHBSC.address, parent:true})
                do{
                    await wait(30)
                    userBalanceBeforeMain = await bscClient.balanceOfERC721(userAddr, merc721MainToken, {parent:true})
                }while(userBalanceBeforeMain == 0)
            }
            let userBalanceBeforeSide = await bscClient.balanceOfERC721(userAddr, merc721SideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)
            const predicateBalanceBeforeMain = await bscClient.balanceOfERC721(merc721PredicateMain, merc721MainToken, {parent:true})
            console.log(`====predicateBalanceBeforeMain====`, predicateBalanceBeforeMain)

            // approve
            let isApproved = await bscClient.isApprovedERC721ForDeposit(merc721MainToken, tokenId, {from:userAddr})
            if (!isApproved) {
                await bscClient.approveERC721ForDeposit(merc721MainToken, tokenId, {from:userAddr})
                do{
                    await wait(20)
                    isApproved = await bscClient.isApprovedERC721ForDeposit(merc721MainToken, tokenId, {from:userAddr})
                }while(!isApproved)
            }

            // deposit
            const depositTx = await bscClient.depositERC721ForUser(merc721MainToken, userAddr, tokenId)
            console.log(`====depositTx====`, depositTx)
            let depositInfo
            let userBalanceAfterSide
            await wait(60)
            while (true) {
                const depositReceipt = bscClient.web3Client.getParentWeb3().eth.getTransactionReceipt(depositTx.transactionHash)
                console.log(`====depositReceipt====`, depositReceipt)
                userBalanceAfterSide = await bscClient.balanceOfERC721(userAddr, merc721SideToken, {parent:false})
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
            const userBalanceAfterMain = await bscClient.balanceOfERC721(userAddr, merc721MainToken, {parent:true})
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            userBalanceAfterSide = await bscClient.balanceOfERC721(userAddr, merc721SideToken, {parent:false})
            console.log(`====userBalanceAfterSide====`, userBalanceAfterSide)
            assert.equal(new BigNumber(userBalanceBeforeMain).minus(userBalanceAfterMain).toString(), 1)
            assert.equal(new BigNumber(userBalanceAfterSide).minus(userBalanceBeforeSide).toString(), 1)

            const predicateBalanceAfterMain = await bscClient.balanceOfERC721(merc721PredicateMain, merc721MainToken, {parent:true})
            console.log(`====predicateBalanceAfterMain====`, predicateBalanceAfterMain)
            console.log(`====predicateBalanceAfterMain - predicateBalanceBeforeMain====`, new BigNumber(predicateBalanceAfterMain).minus(predicateBalanceBeforeMain).toString())

            const ownerOfAfterMain = await bscClient.ownerOfERC721(merc721MainToken, tokenId, {parent:true})
            console.log(`====ownerOfAfterMain====`, ownerOfAfterMain)
            const ownerOfAfterSide = await bscClient.ownerOfERC721(merc721SideToken, tokenId, {parent:false})
            console.log(`====ownerOfAfterSide====`, ownerOfAfterSide)
            assert.equal(ownerOfAfterMain.toLowerCase(), merc721PredicateMain.toLowerCase())
            assert.equal(ownerOfAfterSide, userAddr)

        })
        it('burn', async function() {
            // balance before burn
            let userBalanceBeforeSide = await bscClient.balanceOfERC721(userAddr, merc721SideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)

            // burn
            const tx = await bscClient.burnERC721({ childToken: merc721SideToken, tokenId:tokenId}, {
                from: userAddr,
                gasPrice: 900000000000,
                gas: 300000,
            })
            console.log(`====burnTx====`, tx)

            // balance after burn
            let userBalanceAfterSide = await bscClient.balanceOfERC721(userAddr, merc721SideToken, {parent:false})
            console.log(`====userBalanceAfterSide====`, userBalanceAfterSide)
            assert.equal(new BigNumber(userBalanceBeforeSide).minus(userBalanceAfterSide).toString(), 1)

            fs.writeFile('./burnRecord', '\nbsc-merc721BurnHash: '+tx.transactionHash,{ 'flag': 'a' }, function(error) {
                if (error){
                    console.log('写入burn记录失败')
                }
            })
        })
        it('exit', async function() {
            // balance before exit
            let userBalanceBeforeMain = await bscClient.balanceOfERC721(userAddr, merc721MainToken, {parent:true})
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)

            // exit
            const burnHash = '0x82bacc52c3e5bf05d7d771619b92716e0af71aea6e741f88b218c5ec128ac94a'
            const tx = await bscClient.burnERC721(burnHash,{
                from: userAddr,
                legacyProof: true,
                parent: true,
            })
            console.log(`====exitTx====`, tx)

            // balance after exit
            const userBalanceAfterMain = await bscClient.balanceOfERC721(userAddr, merc721MainToken, {parent:true})
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            assert.equal(new BigNumber(userBalanceAfterMain).minus(userBalanceBeforeMain).toString(), 1)
            const ownerOfAfterMain = await bscClient.ownerOfERC721(merc721MainToken, tokenId, {parent:true})
            console.log(`====ownerOfAfterMain====`, ownerOfAfterMain)
            assert.equal(ownerOfAfterMain.substr(2), userAddr.toLowerCase().substr(2))
        })
    })
})