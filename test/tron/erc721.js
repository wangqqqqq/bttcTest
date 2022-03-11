const { getTronWebClient, getEthClient, getTronWebInstance, pos } = require('../utils/utils')
const { contractOwnerTRON,user } = require('../utils/config')
const BigNumber = require('bignumber.js')
const wait = require('../utils/wait')
const chai = require('chai')
const assert = chai.assert
const util = require('util')
var fs = require('fs')

const userAddr = user.address
const userPk = user.privateKey
const tronClient = getTronWebClient(userPk,userAddr)
const tronWeb = getTronWebInstance()
const ethClient = getEthClient(userPk,userAddr)

const erc721MainToken = pos.TRON.merc721Main
const erc721SideToken = pos.TRON.merc721Side
const erc721PredicateMain = pos.TRON.merc721PredicateMain
const tokenId = '1001'

describe('tron erc721 test', function() {
    this.timeout(1000000)
    describe('#no mintable--mintable', function() {
        it('deposit', async function() {
            // approve
            transaction = await tronWeb.transactionBuilder.triggerConstantContract(erc721MainToken.replace('0x', '41'), 'isApprovedForAll(address,address)', {},
                [{type: 'address', value: userAddr.replace('0x', '41')},{type: 'address', value: erc721PredicateMain.replace('0x', '41')}], userAddr.replace('0x', '41'))
            if (tronWeb.BigNumber(transaction.constant_result, 16) < 100) {
                const result = await tronClient.approveERC721ForDeposit(erc721MainToken, tokenId, {userAddr})
                console.log('====approve-result===='+result)
                await wait(10)
            }

            // balance before deposit
            let userBalanceBeforeMain = new BigNumber((await tronClient.balanceOfERC721(userAddr, erc721MainToken, {parent:true}))._hex,16).toString()
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)
            let userBalanceBeforeSide = await tronClient.balanceOfERC721(userAddr, erc721SideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)
            const predicateBalanceBeforeMain = new BigNumber((await tronClient.balanceOfERC721(erc721PredicateMain, erc721MainToken, {parent:true}))._hex,16).toString()
            console.log(`====predicateBalanceBeforeMain====`, predicateBalanceBeforeMain)

            // deposit
            const depositTx = await getTronWebClient().depositERC721ForUser(erc721MainToken, userAddr, tokenId)
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
            console.log(`====predicateBalanceAfterMain - predicateBalanceBeforeMain====`, new BigNumber(predicateBalanceAfterMain).minus(predicateBalanceBeforeMain).toString())

            const ownerOfAfterMain = await tronClient.ownerOfERC721(erc721MainToken, tokenId, {parent:true})
            console.log(`====ownerOfAfterMain====`, ownerOfAfterMain)
            const ownerOfAfterSide = await tronClient.ownerOfERC721(erc721SideToken, tokenId, {parent:false})
            console.log(`====ownerOfAfterSide====`, ownerOfAfterSide)
            assert.equal(ownerOfAfterMain.substr(2), userAddr.toLowerCase().substr(2))
            assert.equal(ownerOfAfterSide, userAddr)

        })
        it('burn', async function() {
            // balance before burn
            let userBalanceBeforeSide = await tronClient.balanceOfERC721(userAddr, erc721SideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)

            // burn
            const tx = await ethClient.burnERC721({ childToken: erc721SideToken, tokenId:tokenId}, {
                from: userAddr,
                gasPrice: 900000000000,
                gas: 300000,
            })
            console.log(`====burnTx====`, tx)

            // balance after burn
            let userBalanceAfterSide = await tronClient.balanceOfERC721(userAddr, erc721SideToken, {parent:false})
            console.log(`====userBalanceAfterSide====`, userBalanceAfterSide)
            assert.equal(new BigNumber(userBalanceBeforeSide).minus(userBalanceAfterSide).toString(), 1)
            fs.writeFile('./burnRecord', '\ntron-trc721BurnHash: '+tx.transactionHash,{ 'flag': 'a' }, function(error) {
                if (error){
                    console.log('写入burn记录失败')
                }
            })
        })
        it('exit', async function() {
            // balance before exit
            let userBalanceBeforeMain = new BigNumber((await tronClient.balanceOfERC721(userAddr, erc721MainToken, {parent:true}))._hex,16).toString()
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)

            // exit
            const burnHash = '0x9ffb8dd392121357594d1372f8bf5d788fbb29480c9f621bb67bc45b8e1d5c0e'
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
        })
    })
    // process.exit(0)
})