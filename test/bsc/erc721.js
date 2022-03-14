const { contractOwnerETHBSC,user } = require('../utils/config')
const { write,find,remove } = require('../utils/publicMethods')
const { getBscClient, pos } = require('../utils/utils')
const BigNumber = require('bignumber.js')
const wait = require('../utils/wait')
const chai = require('chai')
const assert = chai.assert
const util = require('util')

const bscClientContractOwner = getBscClient(contractOwnerETHBSC.privateKey,contractOwnerETHBSC.address)
const userPk = user.privateKey
const userAddr = user.address
const bscClient = getBscClient(userPk,userAddr)

const erc721MainToken = pos.BSC.erc721Main
const erc721SideToken = pos.BSC.erc721Side
const erc721PredicateMain = pos.BSC.erc721Predicate
const merc721MainToken = pos.BSC.merc721Main
const merc721SideToken = pos.BSC.merc721Side
const merc721PredicateMain = pos.BSC.merc721Predicate

describe('bsc erc721 test', function() {
    this.timeout(2000000)
    describe('#deposit & burn', function() {
        describe('#no mint', function() {
            let tokenId = Math.round(Math.random() * (100000 - 1)) + 1
            it('deposit', async function() {
                // balance before deposit
                let ownerBalanceBefore = await bscClient.balanceOfERC721(contractOwnerETHBSC.address, erc721MainToken, {parent:true})
                let ownerBalanceAfter
                // mint
                console.log(`====no mintERC721 finall tokenId====`, tokenId)
                await bscClientContractOwner.mintERC721Token(erc721MainToken,tokenId,{from:contractOwnerETHBSC.address, parent:true})
                do{
                    await wait(20)
                    ownerBalanceAfter = await bscClient.balanceOfERC721(contractOwnerETHBSC.address, erc721MainToken, {parent:true})
                }while(ownerBalanceAfter == ownerBalanceBefore)

                let ownerBeforeMain
                // transfer
                await bscClientContractOwner.transferERC721Tokens(erc721MainToken, userAddr, tokenId, {from:contractOwnerETHBSC.address, parent:true})

                do{
                    await wait(20)
                    ownerBeforeMain = await bscClient.ownerOfERC721(erc721MainToken,tokenId,{parent:true})

                }while(ownerBeforeMain.toLowerCase().substr(2) != userAddr.toLowerCase().substr(2))
                console.log(`====ERC721 finall tokenId====`, tokenId)

                let userBalanceBeforeMain = await bscClient.balanceOfERC721(userAddr, erc721MainToken, {parent:true})
                console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)
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
                assert.equal(new BigNumber(predicateBalanceAfterMain).minus(predicateBalanceBeforeMain).toString(), 1)

                const ownerOfAfterMain = await bscClient.ownerOfERC721(erc721MainToken, tokenId, {parent:true})
                console.log(`====ownerOfAfterMain====`, ownerOfAfterMain)
                const ownerOfAfterSide = await bscClient.ownerOfERC721(erc721SideToken, tokenId, {parent:false})
                console.log(`====ownerOfAfterSide====`, ownerOfAfterSide)
                assert.equal(ownerOfAfterMain.toLowerCase().substr(2), erc721PredicateMain.toLowerCase().substr(2))
                assert.equal(ownerOfAfterSide, userAddr)
            })

            it('burn', async function() {
                // balance beofre burn
                let userBalanceBeforeSide = await bscClient.balanceOfERC721(userAddr, merc721SideToken, {parent:false})
                console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)

                // burn
                tokenId = 99437;
                const tx = await bscClient.burnERC721({ childToken: erc721SideToken, tokenId:tokenId}, {
                    from: userAddr,
                    gasPrice: 900000000000,
                    gas: 300000,
                })
                console.log(`====burnTx====`, tx)

                // balance after burn
                let userBalanceAfterBurnSide = await bscClient.balanceOfERC721(userAddr, merc721SideToken, {parent:false})
                console.log(`====userBalanceAfterBurnSide====`, userBalanceAfterBurnSide)
                assert.equal(new BigNumber(userBalanceBeforeSide).toString(), new BigNumber(userBalanceAfterBurnSide).toString())

                // write
                assert.equal(await write('bsc-erc721BurnHash:'+tx.transactionHash+',tokenId:'+tokenId),true)
            })
        })
        describe('#mint', function() {
            let tokenId = Math.round(Math.random() * (100000 - 1)) + 1
            let isExists
            it('deposit', async function() {
                isExists = await bscClient.isExistsMintERC721(merc721MainToken,tokenId,{parent:true})
                while (isExists) {
                    let owner = await bscClient.ownerOfERC721(merc721MainToken,tokenId,{parent:true})
                    let isOwner = owner.toLowerCase().substr(2).toString()==userAddr.toLowerCase().substr(2).toString()
                    if (isOwner) {
                        break;
                    }
                    tokenId = Math.round(Math.random*1000000)
                    isExists = await bscClient.isExistsMintERC721(merc721MainToken,tokenId,{parent:true})
                }
                console.log(`====mintERC721 finall tokenId====`, tokenId)
                if (!isExists){
                    // mint
                    await bscClientContractOwner.mintERC721TokenTo(merc721MainToken,userAddr,tokenId,{from:contractOwnerETHBSC.address, parent:true})
                    do{
                        await wait(20)
                        isExists = await bscClient.isExistsMintERC721(merc721MainToken,tokenId,{parent:true})
                    }while(!isExists)
                }
                // balance before deposit
                let userBalanceBeforeMain = await bscClient.balanceOfERC721(userAddr, merc721MainToken, {parent:true})
                console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)
                let userBalanceBeforeSide = await bscClient.balanceOfERC721(userAddr, merc721SideToken, {parent:false})
                console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)
                const predicateBalanceBeforeMain = await bscClient.balanceOfERC721(merc721PredicateMain, merc721MainToken, {parent:true})
                console.log(`====predicateBalanceBeforeMain====`, predicateBalanceBeforeMain)
                let ownerBeforeMain = await bscClient.ownerOfERC721(merc721MainToken,tokenId,{parent:true})
                assert.equal(ownerBeforeMain.toLowerCase().substr(2), userAddr.toLowerCase().substr(2))

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
                assert.equal(new BigNumber(predicateBalanceAfterMain).minus(predicateBalanceBeforeMain).toString(), 1)

                const ownerOfAfterMain = await bscClient.ownerOfERC721(merc721MainToken, tokenId, {parent:true})
                console.log(`====ownerOfAfterMain====`, ownerOfAfterMain)
                const ownerOfAfterSide = await bscClient.ownerOfERC721(merc721SideToken, tokenId, {parent:false})
                console.log(`====ownerOfAfterSide====`, ownerOfAfterSide)
                assert.equal(ownerOfAfterMain.toLowerCase().substr(2), merc721PredicateMain.toLowerCase().substr(2))
                assert.equal(ownerOfAfterSide, userAddr)
            })

            it('burn', async function() {
                // balance beofre burn
                let userBalanceBeforeSide = await bscClient.balanceOfERC721(userAddr, merc721SideToken, {parent:false})
                console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)

                // burn
                tokenId = 76221;
                const tx = await bscClient.burnERC721({ childToken: merc721SideToken, tokenId:tokenId}, {
                    from: userAddr,
                    gasPrice: 900000000000,
                    gas: 300000,
                })
                console.log(`====burnTx====`, tx)

                // balance after burn
                let userBalanceAfterBurnSide = await bscClient.balanceOfERC721(userAddr, merc721SideToken, {parent:false})
                console.log(`====userBalanceAfterBurnSide====`, userBalanceAfterBurnSide)
                assert.equal(new BigNumber(userBalanceBeforeSide).toString(), new BigNumber(userBalanceAfterBurnSide).toString())

                // write
                assert.equal(await write('bsc-merc721BurnHash:'+tx.transactionHash+',tokenId:'+tokenId),true)
            })
        })
    })

    describe('#exit', function() {
        it('no mint exit', async function() {
                // balance before exit
                let userBalanceBeforeMain = await bscClient.balanceOfERC721(userAddr, erc721MainToken, {parent:true})
                console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)

                // exit
                let map = await find('bsc-erc721BurnHash')
                const burnHash = map.get('hash')
                console.log("burnHash:"+burnHash)
                const tokenId = map.get('tokenId')
                const tx = await bscClient.exitERC721(burnHash,{
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
                assert.equal(ownerOfAfterMain.toLowerCase().substr(2), userAddr.toLowerCase().substr(2))

                // remove
                assert.equal(await remove(burnHash),true)
            })

        it('mint exit', async function() {
            // balance before exit
            let userBalanceBeforeMain = await bscClient.balanceOfERC721(userAddr, merc721MainToken, {parent:true})
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)

            // exit
            let map = await find('bsc-merc721BurnHash')
            const burnHash = map.get('hash')
            console.log("burnHash:"+burnHash)
            const tokenId = map.get('tokenId')
            const tx = await bscClient.exitERC721(burnHash,{
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
            assert.equal(ownerOfAfterMain.toLowerCase().substr(2), userAddr.toLowerCase().substr(2))

            // remove
            assert.equal(await remove(burnHash),true)
        })
    })
    after(async function () {
        process.exit()
    })
})