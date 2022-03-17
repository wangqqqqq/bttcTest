const { getTronWebClient, getEthClient, getTronWebInstance, pos } = require('../utils/utils')
const { write,find,remove,broadcaster,to64Bytes } = require('../utils/publicMethods')
const { contractOwnerTRON,user } = require('../utils/config')
const BigNumber = require('bignumber.js')
const wait = require('../utils/wait')
const chai = require('chai')
const assert = chai.assert
const util = require('util')
var fs = require('fs')

const tronClientContractOwner = getTronWebClient(contractOwnerTRON.privateKey,contractOwnerTRON.address)
const userAddr = user.address
const userPk = user.privateKey
const tronClient = getTronWebClient(userPk,userAddr)
const tronWeb = getTronWebInstance()
const ethClient = getEthClient(userPk,userAddr)

const erc721MainToken = pos.TRON.erc721Main
const erc721SideToken = pos.TRON.erc721Side
const erc721PredicateMain = pos.TRON.erc721Predicate
const merc721MainToken = pos.TRON.merc721Main
const merc721SideToken = pos.TRON.merc721Side
const merc721PredicateMain = pos.TRON.merc721Predicate
const chainManagerAddr = pos.TRON.chainManagerAddress

describe('tron erc721 test', function() {
    this.timeout(2000000)
    describe('#no mintable token in mainChain', function() {
        let tokenId = Math.round(Math.random() * (100000 - 1)) + 1
        it('deposit', async function() {
            // balance before deposit
            let ownerBalanceBefore = await tronClient.balanceOfERC721(contractOwnerTRON.address, erc721MainToken, {parent:true})
            let ownerBalanceAfter
            // mint
            await tronClientContractOwner.mintERC721Tokens(erc721MainToken,tokenId,{from:contractOwnerTRON.address, parent:true})
            do{
                await wait(20)
                ownerBalanceAfter = await tronClient.balanceOfERC721(contractOwnerTRON.address, erc721MainToken, {parent:true})
            }while(ownerBalanceAfter == ownerBalanceBefore)

            let ownerBeforeMain
            // transfer
            await tronClientContractOwner.transferERC721Tokens(erc721MainToken, userAddr, tokenId, {from:contractOwnerTRON.address, parent:true})

            do{
                await wait(20)
                ownerBeforeMain = await tronClient.ownerOfERC721(erc721MainToken,tokenId,{parent:true})

            }while(ownerBeforeMain.toLowerCase().substr(2) != userAddr.toLowerCase().substr(2))
            console.log(`====no mintERC721 finall tokenId====`, tokenId)

            let userBalanceBeforeMain = new BigNumber((await tronClient.balanceOfERC721(userAddr, erc721MainToken, {parent:true}))._hex,16).toString()
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)
            let userBalanceBeforeSide = await tronClient.balanceOfERC721(userAddr, erc721SideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)
            const predicateBalanceBeforeMain = new BigNumber((await tronClient.balanceOfERC721(erc721PredicateMain, erc721MainToken, {parent:true}))._hex,16).toString()
            console.log(`====predicateBalanceBeforeMain====`, predicateBalanceBeforeMain)

            // approve
            let isApproved = await tronClient.isApprovedERC721ForDeposit(erc721MainToken, tokenId, {from:userAddr})
            if (!isApproved) {
                await tronClient.approveERC721ForDeposit(erc721MainToken, tokenId, {from:userAddr})
                do{
                    await wait(20)
                    isApproved = await tronClient.isApprovedERC721ForDeposit(erc721MainToken, tokenId, {from:userAddr})
                }while(!isApproved)
            }

            // deposit
            const depositTx = await tronClient.depositERC721ForUser(erc721MainToken, userAddr, tokenId)
            console.log(`====depositTx====`, depositTx)
            let depositInfo
            let userBalanceAfterSide
            await wait(60)
            while (true) {
                depositInfo = await tronWeb.trx.getTransactionInfo(depositTx)
                userBalanceAfterSide = await tronClient.balanceOfERC721(userAddr, erc721SideToken, {parent:false})
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
            const userBalanceAfterMain = new BigNumber((await tronClient.balanceOfERC721(userAddr, erc721MainToken, {parent:true}))._hex,16).toString()
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            userBalanceAfterSide = await tronClient.balanceOfERC721(userAddr, erc721SideToken, {parent:false})
            console.log(`====userBalanceAfterSide====`, userBalanceAfterSide)
            assert.equal(new BigNumber(userBalanceBeforeMain).minus(userBalanceAfterMain).toString(), 1)
            assert.equal(new BigNumber(userBalanceAfterSide).minus(userBalanceBeforeSide).toString(), 1)

            const predicateBalanceAfterMain = new BigNumber((await tronClient.balanceOfERC721(erc721PredicateMain, erc721MainToken, {parent:true}))._hex,16).toString()
            console.log(`====predicateBalanceAfterMain====`, predicateBalanceAfterMain)
            assert.equal(new BigNumber(predicateBalanceAfterMain).minus(predicateBalanceBeforeMain).toString(), 1)

            const ownerOfAfterMain = await tronClient.ownerOfERC721(erc721MainToken, tokenId, {parent:true})
            console.log(`====ownerOfAfterMain====`, ownerOfAfterMain)
            const ownerOfAfterSide = await tronClient.ownerOfERC721(erc721SideToken, tokenId, {parent:false})
            console.log(`====ownerOfAfterSide====`, ownerOfAfterSide)
            assert.equal(ownerOfAfterMain.toLowerCase().substr(2), erc721PredicateMain.toLowerCase().substr(2))
            assert.equal(ownerOfAfterSide, userAddr)

        })
        it('burn', async function() {
            // balance before burn
            let userBalanceBeforeSide = await tronClient.balanceOfERC721(userAddr, erc721SideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)

            // burn
            tokenId = 41999;// Each test requires manual modification
            const tx = await ethClient.burnERC721({ childToken: erc721SideToken, tokenId:tokenId}, {
                from: userAddr,
                gasPrice: 900000000000,
                gas: 300000,
            })
            console.log(`====burnTx====`, tx)

            // balance after burn
            await wait(30)
            let userBalanceAfterBurnSide = await tronClient.balanceOfERC721(userAddr, erc721SideToken, {parent:false})
            console.log(`====userBalanceAfterBurnSide====`, userBalanceAfterBurnSide)
            assert.equal(userBalanceBeforeSide - 1, userBalanceAfterBurnSide)

            // write
            assert.equal(await write('tron-trc721BurnHash:'+tx.transactionHash+',tokenId:'+tokenId),true)
        })
        it('exit', async function() {
            // balance before exit
            let userBalanceBeforeMain = new BigNumber((await tronClient.balanceOfERC721(userAddr, erc721MainToken, {parent:true}))._hex,16).toString()
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)

            // exit
            let map = await find('tron-trc721BurnHash')
            const burnHash = map.get('hash')
            console.log("burnHash:"+burnHash)
            const tokenId = map.get('tokenId')
            const tx = await tronClient.exitERC721(burnHash,{
                from: userAddr,
                legacyProof: true,
                parent: true,
            })
            console.log(`====exitTx====`, tx)

            // balance after exit
            const userBalanceAfterMain = new BigNumber((await tronClient.balanceOfERC721(userAddr, erc721MainToken, {parent:true}))._hex,16).toString()
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            assert.equal(new BigNumber(userBalanceAfterMain).minus(userBalanceBeforeMain).toString(), 1)
            const ownerOfAfterMain = await tronClient.ownerOfERC721(erc721MainToken, tokenId, {parent:true})
            console.log(`====ownerOfAfterMain====`, ownerOfAfterMain)
            assert.equal(ownerOfAfterMain.substr(2), userAddr.toLowerCase().substr(2))

            // remove
            assert.equal(await remove(burnHash),true)
        })
    })
    describe('#mintable token in mainChain', function() {
        let tokenId = Math.round(Math.random() * (100000 - 1)) + 1
        it('deposit', async function() {
            // balance before deposit
            let isExists = await tronClient.isExistsMintERC721(merc721MainToken,tokenId,{parent:true})
            while (isExists) {
                let owner = await tronClient.ownerOfERC721(merc721MainToken,tokenId,{parent:true})
                let isOwner = owner.toLowerCase().substr(2).toString()==userAddr.toLowerCase().substr(2).toString()
                if (isOwner) {
                    break;
                }
                tokenId =Math.round(Math.random() * (100000 - 1)) + 1
                isExists = await tronClient.isExistsMintERC721(merc721MainToken,tokenId,{parent:true})
            }
            console.log(`====mintERC721 finall tokenId====`, tokenId)
            if (!isExists){
                // mint
                const triggerTransaction = await tronWeb.transactionBuilder.triggerSmartContract(
                    merc721MainToken.replace('0x','41'), 'mint(address,uint256)', {}, [{type: 'address', value: userAddr.replace('0x','41')},{type: 'uint256', value: tokenId}], contractOwnerTRON.address.replace('0x','41'));
                const triggerTx = await broadcaster(null, contractOwnerTRON.privateKey, triggerTransaction.transaction);
                console.log("triggerTx:"+util.inspect(triggerTx))

                do{
                    await wait(20)
                    isExists = await tronClient.isExistsMintERC721(merc721MainToken,tokenId,{parent:true})
                }while(!isExists)
            }

            let userBalanceBeforeMain = new BigNumber((await tronClient.balanceOfERC721(userAddr, merc721MainToken, {parent:true}))._hex,16).toString()
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)
            let userBalanceBeforeSide = await tronClient.balanceOfERC721(userAddr, merc721SideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)
            const predicateBalanceBeforeMain = new BigNumber((await tronClient.balanceOfERC721(merc721PredicateMain, merc721MainToken, {parent:true}))._hex,16).toString()
            console.log(`====predicateBalanceBeforeMain====`, predicateBalanceBeforeMain)

            // approve
            let isApproved = await tronClient.isApprovedERC721ForDeposit(merc721MainToken, tokenId, {from:userAddr})
            if (!isApproved) {
                const triggerTransaction = await tronWeb.transactionBuilder.triggerSmartContract(
                    merc721MainToken.replace('0x','41'), 'approve(address,uint256)', {}, [{type: 'address', value: merc721PredicateMain.replace('0x','41')},{type: 'uint256', value: tokenId}], userAddr.replace('0x','41'));
                const triggerTx = await broadcaster(null, userPk, triggerTransaction.transaction);
                console.log("triggerTx:"+util.inspect(triggerTx))

                do{
                    await wait(20)
                    isApproved = await tronClient.isApprovedERC721ForDeposit(merc721MainToken, tokenId, {from:userAddr})
                }while(!isApproved)
            }

            // deposit
            // const depositTx = await tronClient.depositERC721ForUser(merc721MainToken, userAddr, tokenId)
            // console.log(`====depositTx====`, depositTx)
            const triggerTransaction = await tronWeb.transactionBuilder.triggerSmartContract(
                chainManagerAddr, 'depositFor(address,address,bytes)', {},
                [
                    {type: 'address', value: userAddr.replace('0x','41')},
                    {type: 'address', value: merc721MainToken.replace('0x','41')},
                    {type: 'bytes', value: await to64Bytes(tokenId)}], userAddr.replace('0x','41'));
            const triggerTx = await broadcaster(null, userPk, triggerTransaction.transaction);
            console.log("triggerTx:"+util.inspect(triggerTx))
            let depositInfo
            let userBalanceAfterSide
            await wait(60)
            while (true) {
                depositInfo = await tronWeb.trx.getTransactionInfo(triggerTx.transaction.txID)
                userBalanceAfterSide = await tronClient.balanceOfERC721(userAddr, merc721SideToken, {parent:false})
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
            const userBalanceAfterMain = new BigNumber((await tronClient.balanceOfERC721(userAddr, merc721MainToken, {parent:true}))._hex,16).toString()
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            userBalanceAfterSide = await tronClient.balanceOfERC721(userAddr, merc721SideToken, {parent:false})
            console.log(`====userBalanceAfterSide====`, userBalanceAfterSide)
            assert.equal(new BigNumber(userBalanceBeforeMain).minus(userBalanceAfterMain).toString(), 1)
            assert.equal(new BigNumber(userBalanceAfterSide).minus(userBalanceBeforeSide).toString(), 1)

            const predicateBalanceAfterMain = new BigNumber((await tronClient.balanceOfERC721(merc721PredicateMain, merc721MainToken, {parent:true}))._hex,16).toString()
            console.log(`====predicateBalanceAfterMain====`, predicateBalanceAfterMain)
            assert.equal(new BigNumber(predicateBalanceAfterMain).minus(predicateBalanceBeforeMain).toString(), 1)

            const ownerOfAfterMain = await tronClient.ownerOfERC721(merc721MainToken, tokenId, {parent:true})
            console.log(`====ownerOfAfterMain====`, ownerOfAfterMain)
            const ownerOfAfterSide = await tronClient.ownerOfERC721(merc721SideToken, tokenId, {parent:false})
            console.log(`====ownerOfAfterSide====`, ownerOfAfterSide)
            assert.equal(ownerOfAfterMain.toLowerCase().substr(2), merc721PredicateMain.toLowerCase().substr(2))
            assert.equal(ownerOfAfterSide, userAddr)
        })
        it('burn', async function() {
            // balance before burn
            let userBalanceBeforeSide = await tronClient.balanceOfERC721(userAddr, merc721SideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)

            // burn
            tokenId = 28822;// Each test requires manual modification
            const tx = await ethClient.burnERC721({ childToken: merc721SideToken, tokenId:tokenId}, {
                from: userAddr,
                gasPrice: 900000000000,
                gas: 300000,
            })
            console.log(`====burnTx====`, tx)

            // balance after burn
            await wait(30)
            let userBalanceAfterBurnSide = await tronClient.balanceOfERC721(userAddr, merc721SideToken, {parent:false})
            console.log(`====userBalanceAfterBurnSide====`, userBalanceAfterBurnSide)
            assert.equal(userBalanceBeforeSide - 1, userBalanceAfterBurnSide)

            // write
            assert.equal(await write('tron-mtrc721BurnHash:'+tx.transactionHash+',tokenId:'+tokenId),true)
        })
        it('exit', async function() {
            // balance before exit
            let userBalanceBeforeMain = new BigNumber((await tronClient.balanceOfERC721(userAddr, merc721MainToken, {parent:true}))._hex,16).toString()
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)

            // exit
            let map = await find('tron-mtrc721BurnHash')
            const burnHash = map.get('hash')
            console.log("burnHash:"+burnHash)
            const tokenId = map.get('tokenId')
            const tx = await tronClient.exitERC721(burnHash,{
                from: userAddr,
                legacyProof: true,
                parent: true,
            })
            console.log(`====exitTx====`, tx)

            // balance after exit
            const userBalanceAfterMain = new BigNumber((await tronClient.balanceOfERC721(userAddr, merc721MainToken, {parent:true}))._hex,16).toString()
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            assert.equal(new BigNumber(userBalanceAfterMain).minus(userBalanceBeforeMain).toString(), 1)
            const ownerOfAfterMain = await tronClient.ownerOfERC721(merc721MainToken, tokenId, {parent:true})
            console.log(`====ownerOfAfterMain====`, ownerOfAfterMain)
            assert.equal(ownerOfAfterMain.substr(2), userAddr.toLowerCase().substr(2))

            // remove
            assert.equal(await remove(burnHash),true)
        })
    })
    after(async function () {
        process.exit()
    })
})