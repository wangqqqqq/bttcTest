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
const ethClient = getEthClient(userPk,userAddr)

const erc721MainToken = pos.ETH.erc721Main
const erc721SideToken = pos.ETH.erc721Side
const erc721PredicateMain = pos.ETH.erc721Predicate
const merc721MainToken = pos.ETH.merc721Main
const merc721SideToken = pos.ETH.merc721Side
const merc721PredicateMain = pos.ETH.merc721Predicate

describe('eth erc721 test', function() {
    this.timeout(2000000)
    describe('#no mintable token in mainChain', function() {
        let tokenId = Math.round(Math.random() * (100000 - 1)) + 1
        it('deposit', async function() {
            // balance before deposit
            let ownerBalanceBefore = await ethClient.balanceOfERC721(contractOwnerETHBSC.address, erc721MainToken, {parent:true})
            let ownerBalanceAfter
            // mint
            console.log(`====no mintERC721 finall tokenId====`, tokenId)
            await ethClientContractOwner.mintERC721Token(erc721MainToken,tokenId,{from:contractOwnerETHBSC.address, parent:true})
            do{
                await wait(20)
                ownerBalanceAfter = await ethClient.balanceOfERC721(contractOwnerETHBSC.address, erc721MainToken, {parent:true})
            }while(ownerBalanceAfter == ownerBalanceBefore)

            let ownerBeforeMain
            // transfer
            await ethClientContractOwner.transferERC721Tokens(erc721MainToken, userAddr, tokenId, {from:contractOwnerETHBSC.address, parent:true})

            do{
                await wait(20)
                ownerBeforeMain = await ethClient.ownerOfERC721(erc721MainToken,tokenId,{parent:true})

            }while(ownerBeforeMain.toLowerCase().substr(2) != userAddr.toLowerCase().substr(2))
            console.log(`====ERC721 finall tokenId====`, tokenId)

            let userBalanceBeforeMain = await ethClient.balanceOfERC721(userAddr, erc721MainToken, {parent:true})
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)
            let userBalanceBeforeSide = await ethClient.balanceOfERC721(userAddr, erc721SideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)
            const predicateBalanceBeforeMain = await ethClient.balanceOfERC721(erc721PredicateMain, erc721MainToken, {parent:true})
            console.log(`====predicateBalanceBeforeMain====`, predicateBalanceBeforeMain)

            // approve
            let isApproved = await ethClient.isApprovedERC721ForDeposit(erc721MainToken, tokenId, {from:userAddr})
            if (!isApproved) {
                await ethClient.approveERC721ForDeposit(erc721MainToken, tokenId, {from:userAddr})
                do{
                    await wait(20)
                    isApproved = await ethClient.isApprovedERC721ForDeposit(erc721MainToken, tokenId, {from:userAddr})
                }while(!isApproved)
            }

            // deposit
            const depositTx = await ethClient.depositERC721ForUser(erc721MainToken, userAddr, tokenId)
            console.log(`====depositTx====`, depositTx)
            let userBalanceAfterSide
            await wait(60)
            while (true) {
                userBalanceAfterSide = await ethClient.balanceOfERC721(userAddr, erc721SideToken, {parent:false})
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
            const userBalanceAfterMain = await ethClient.balanceOfERC721(userAddr, erc721MainToken, {parent:true})
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            userBalanceAfterSide = await ethClient.balanceOfERC721(userAddr, erc721SideToken, {parent:false})
            console.log(`====userBalanceAfterSide====`, userBalanceAfterSide)
            assert.equal(new BigNumber(userBalanceBeforeMain).minus(userBalanceAfterMain).toString(), 1)
            assert.equal(new BigNumber(userBalanceAfterSide).minus(userBalanceBeforeSide).toString(), 1)

            const predicateBalanceAfterMain = await ethClient.balanceOfERC721(erc721PredicateMain, erc721MainToken, {parent:true})
            console.log(`====predicateBalanceAfterMain====`, predicateBalanceAfterMain)
            assert.equal(new BigNumber(predicateBalanceAfterMain).minus(predicateBalanceBeforeMain).toString(), 1)

            const ownerOfAfterMain = await ethClient.ownerOfERC721(erc721MainToken, tokenId, {parent:true})
            console.log(`====ownerOfAfterMain====`, ownerOfAfterMain)
            const ownerOfAfterSide = await ethClient.ownerOfERC721(erc721SideToken, tokenId, {parent:false})
            console.log(`====ownerOfAfterSide====`, ownerOfAfterSide)
            assert.equal(ownerOfAfterMain.toLowerCase().substr(2), erc721PredicateMain.toLowerCase().substr(2))
            assert.equal(ownerOfAfterSide, userAddr)
        })
        it('burn', async function() {
            // balance beofre burn
            let userBalanceBeforeSide = await ethClient.balanceOfERC721(userAddr, erc721SideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)

            // burn
            tokenId = 49973;// Each test requires manual modification
            const tx = await ethClient.burnERC721({ childToken: erc721SideToken, tokenId:tokenId}, {
                from: userAddr,
                gasPrice: 900000000000,
                gas: 300000,
            })
            console.log(`====burnTx====`, tx)

            // balance after burn
            await wait(30)
            let userBalanceAfterBurnSide = await ethClient.balanceOfERC721(userAddr, erc721SideToken, {parent:false})
            console.log(`====userBalanceAfterBurnSide====`, userBalanceAfterBurnSide)
            assert.equal(userBalanceBeforeSide - 1, userBalanceAfterBurnSide)

            // write
            assert.equal(await write('eth-erc721BurnHash:'+tx.transactionHash+',tokenId:'+tokenId),true)
        })
        it('exit', async function() {
            // balance before exit
            let userBalanceBeforeMain = await ethClient.balanceOfERC721(userAddr, erc721MainToken, {parent:true})
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)

            // exit
            let map = await find('eth-erc721BurnHash')
            const burnHash = map.get('hash')
            console.log("burnHash:"+burnHash)
            const tokenId = map.get('tokenId')
            const tx = await ethClient.exitERC721(burnHash,{
                from: userAddr,
                legacyProof: true,
                parent: true,
            })
            console.log(`====exitTx====`, tx)

            // balance after exit
            const userBalanceAfterMain = await ethClient.balanceOfERC721(userAddr, erc721MainToken, {parent:true})
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            assert.equal(new BigNumber(userBalanceAfterMain).minus(userBalanceBeforeMain).toString(), 1)
            const ownerOfAfterMain = await ethClient.ownerOfERC721(erc721MainToken, tokenId, {parent:true})
            console.log(`====ownerOfAfterMain====`, ownerOfAfterMain)
            assert.equal(ownerOfAfterMain.toLowerCase().substr(2), userAddr.toLowerCase().substr(2))

            // remove
            assert.equal(await remove(burnHash),true)
        })
    })
    describe('#mintable token in mainChain', function() {
        let tokenId = Math.round(Math.random() * (100000 - 1)) + 1
        it('deposit', async function() {
            let isExists = await ethClient.isExistsMintERC721(merc721MainToken,tokenId,{parent:true})
            while (isExists) {
                let owner = await ethClient.ownerOfERC721(merc721MainToken,tokenId,{parent:true})
                let isOwner = owner.toLowerCase().substr(2).toString()==userAddr.toLowerCase().substr(2).toString()
                if (isOwner) {
                    break;
                }
                tokenId = Math.round(Math.random*1000000)
                isExists = await ethClient.isExistsMintERC721(merc721MainToken,tokenId,{parent:true})
            }
            console.log(`====mintERC721 finall tokenId====`, tokenId)
            if (!isExists){
                // mint
                await ethClientContractOwner.mintERC721TokenTo(merc721MainToken,userAddr,tokenId,{from:contractOwnerETHBSC.address, parent:true})
                do{
                    await wait(20)
                    isExists = await ethClient.isExistsMintERC721(merc721MainToken,tokenId,{parent:true})
                }while(!isExists)
            }
            // balance before deposit
            let userBalanceBeforeMain = await ethClient.balanceOfERC721(userAddr, merc721MainToken, {parent:true})
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)
            let userBalanceBeforeSide = await ethClient.balanceOfERC721(userAddr, merc721SideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)
            const predicateBalanceBeforeMain = await ethClient.balanceOfERC721(merc721PredicateMain, merc721MainToken, {parent:true})
            console.log(`====predicateBalanceBeforeMain====`, predicateBalanceBeforeMain)
            let ownerBeforeMain = await ethClient.ownerOfERC721(merc721MainToken,tokenId,{parent:true})
            assert.equal(ownerBeforeMain.toLowerCase().substr(2), userAddr.toLowerCase().substr(2))

            // approve
            let isApproved = await ethClient.isApprovedERC721ForDeposit(merc721MainToken, tokenId, {from:userAddr})
            if (!isApproved) {
                await ethClient.approveERC721ForDeposit(merc721MainToken, tokenId, {from:userAddr})
                do{
                    await wait(20)
                    isApproved = await ethClient.isApprovedERC721ForDeposit(merc721MainToken, tokenId, {from:userAddr})
                }while(!isApproved)
            }

            // deposit
            const depositTx = await ethClient.depositERC721ForUser(merc721MainToken, userAddr, tokenId)
            console.log(`====depositTx====`, depositTx)
            let userBalanceAfterSide
            await wait(60)
            while (true) {
                userBalanceAfterSide = await ethClient.balanceOfERC721(userAddr, merc721SideToken, {parent:false})
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
            const userBalanceAfterMain = await ethClient.balanceOfERC721(userAddr, merc721MainToken, {parent:true})
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            userBalanceAfterSide = await ethClient.balanceOfERC721(userAddr, merc721SideToken, {parent:false})
            console.log(`====userBalanceAfterSide====`, userBalanceAfterSide)
            assert.equal(new BigNumber(userBalanceBeforeMain).minus(userBalanceAfterMain).toString(), 1)
            assert.equal(new BigNumber(userBalanceAfterSide).minus(userBalanceBeforeSide).toString(), 1)

            const predicateBalanceAfterMain = await ethClient.balanceOfERC721(merc721PredicateMain, merc721MainToken, {parent:true})
            console.log(`====predicateBalanceAfterMain====`, predicateBalanceAfterMain)
            assert.equal(new BigNumber(predicateBalanceAfterMain).minus(predicateBalanceBeforeMain).toString(), 1)

            const ownerOfAfterMain = await ethClient.ownerOfERC721(merc721MainToken, tokenId, {parent:true})
            console.log(`====ownerOfAfterMain====`, ownerOfAfterMain)
            const ownerOfAfterSide = await ethClient.ownerOfERC721(merc721SideToken, tokenId, {parent:false})
            console.log(`====ownerOfAfterSide====`, ownerOfAfterSide)
            assert.equal(ownerOfAfterMain.toLowerCase().substr(2), merc721PredicateMain.toLowerCase().substr(2))
            assert.equal(ownerOfAfterSide, userAddr)
        })
        it('burn', async function() {
            // balance beofre burn
            let userBalanceBeforeSide = await ethClient.balanceOfERC721(userAddr, merc721SideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)

            // burn
            tokenId = 94910;// Each test requires manual modification
            const tx = await ethClient.burnERC721({ childToken: merc721SideToken, tokenId:tokenId}, {
                from: userAddr,
                gasPrice: 900000000000,
                gas: 300000,
            })
            console.log(`====burnTx====`, tx)

            // balance after burn
            await wait(30)
            let userBalanceAfterBurnSide = await ethClient.balanceOfERC721(userAddr, merc721SideToken, {parent:false})
            console.log(`====userBalanceAfterBurnSide====`, userBalanceAfterBurnSide)
            assert.equal(userBalanceBeforeSide - 1, userBalanceAfterBurnSide)

            // write
            assert.equal(await write('eth-merc721BurnHash:'+tx.transactionHash+',tokenId:'+tokenId),true)
        })
        it('exit', async function() {
            // balance before exit
            let userBalanceBeforeMain = await ethClient.balanceOfERC721(userAddr, merc721MainToken, {parent:true})
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)

            // exit
            let map = await find('eth-merc721BurnHash')
            const burnHash = map.get('hash')
            console.log("burnHash:"+burnHash)
            const tokenId = map.get('tokenId')
            const tx = await ethClient.exitERC721(burnHash,{
                from: userAddr,
                legacyProof: true,
                parent: true,
            })
            console.log(`====exitTx====`, tx)

            // balance after exit
            const userBalanceAfterMain = await ethClient.balanceOfERC721(userAddr, merc721MainToken, {parent:true})
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            assert.equal(new BigNumber(userBalanceAfterMain).minus(userBalanceBeforeMain).toString(), 1)
            const ownerOfAfterMain = await ethClient.ownerOfERC721(merc721MainToken, tokenId, {parent:true})
            console.log(`====ownerOfAfterMain====`, ownerOfAfterMain)
            assert.equal(ownerOfAfterMain.toLowerCase().substr(2), userAddr.toLowerCase().substr(2))

            // remove
            assert.equal(await remove(burnHash),true)
        })
    })
    after(async function () {
        process.exit()
    })
})