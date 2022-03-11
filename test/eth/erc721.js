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

const erc721MainToken = pos.ETH.erc721Main
const erc721SideToken = pos.ETH.erc721Side
const erc721PredicateMain = pos.ETH.erc721Predicate
const tokenId = '1001'

describe('eth erc721 test', function() {
    this.timeout(1000000)
    describe('#mintable<-->no mintable', function() {
        it('deposit', async function() {
            // // approve
            // transaction = await tronWeb.transactionBuilder.triggerConstantContract(erc721MainToken.replace('0x', '41'), 'allowance(address,address)', {},
            //     [{type: 'address', value: from.replace('0x', '41')},{type: 'address', value: erc721PredicateMain.replace('0x', '41')}], from.replace('0x', '41'))
            // if (tronWeb.BigNumber(transaction.constant_result, 16) < 100) {
                const result = await ethClient.approveERC721ForDeposit(erc721MainToken, tokenId, {from})
                console.log('====approve-result===='+result)
                await wait(10)
            // }

            // balance before deposit
            let userBalanceBeforeMain = await ethClient.balanceOfERC721(from, erc721MainToken, {parent:true})
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)
            let userBalanceBeforeSide = await ethClient.balanceOfERC721(from, erc721SideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)
            const predicateBalanceBeforeMain = await ethClient.balanceOfERC721(erc721PredicateMain, erc721MainToken, {parent:true})
            console.log(`====predicateBalanceBeforeMain====`, predicateBalanceBeforeMain)

            // deposit
            const depositTx = await ethClient.depositERC721ForUser(erc721MainToken, from, tokenId)
            console.log(`====depositTx====`, depositTx)
            let depositInfo
            let userBalanceAfterSide
            await wait(60)
            while (true) {
                const depositReceipt = ethClient.web3Client.getParentWeb3().eth.getTransactionReceipt(depositTx.transactionHash)
                console.log(`====depositReceipt====`, depositReceipt)
                userBalanceAfterSide = await ethClient.balanceOfERC721(from, erc721SideToken, {parent:false})
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
            const userBalanceAfterMain = await ethClient.balanceOfERC721(from, erc721MainToken, {parent:true})
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            userBalanceAfterSide = await ethClient.balanceOfERC721(from, erc721SideToken, {parent:false})
            console.log(`====userBalanceAfterSide====`, userBalanceAfterSide)
            assert.equal(new BigNumber(userBalanceBeforeMain).minus(userBalanceAfterMain).toString(), 1)
            assert.equal(new BigNumber(userBalanceAfterSide).minus(userBalanceBeforeSide).toString(), 1)

            const predicateBalanceAfterMain = await ethClient.balanceOfERC721(erc721PredicateMain, erc721MainToken, {parent:true})
            console.log(`====predicateBalanceAfterMain====`, predicateBalanceAfterMain)
            console.log(`====predicateBalanceAfterMain - predicateBalanceBeforeMain====`, new BigNumber(predicateBalanceAfterMain).minus(predicateBalanceBeforeMain).toString())

            const ownerOfAfterMain = await ethClient.ownerOfERC721(erc721MainToken, tokenId, {parent:true})
            console.log(`====ownerOfAfterMain====`, ownerOfAfterMain)
            const ownerOfAfterSide = await ethClient.ownerOfERC721(erc721SideToken, tokenId, {parent:false})
            console.log(`====ownerOfAfterSide====`, ownerOfAfterSide)

        })
        it('burn', async function() {
            // balance before burn
            let userBalanceBeforeSide = await ethClient.balanceOfERC721(from, erc721SideToken, {parent:false})
            console.log(`====userBalanceBeforeSide====`, userBalanceBeforeSide)

            // burn
            const tokenId = 1001
            const tx = await ethClient.burnERC721({ childToken: erc721SideToken, tokenId:tokenId}, {
                from: from,
                gasPrice: 900000000000,
                gas: 300000,
            })
            console.log(`====burnTx====`, tx)

            // balance after burn
            let userBalanceAfterSide = await ethClient.balanceOfERC721(from, erc721SideToken, {parent:false})
            console.log(`====userBalanceAfterSide====`, userBalanceAfterSide)
            assert.equal(new BigNumber(userBalanceBeforeSide).minus(userBalanceAfterSide).toString(), 1)

            fs.writeFile('./burnRecord', '\neth-erc721BurnHash: '+tx.transactionHash,{ 'flag': 'a' }, function(error) {
                if (error){
                    console.log('写入burn记录失败')
                }
            })
        })
        it('exit', async function() {
            // balance before exit
            let userBalanceBeforeMain = await ethClient.balanceOfERC721(from, erc721MainToken, {parent:true})
            console.log(`====userBalanceBeforeMain====`, userBalanceBeforeMain)

            // exit
            const burnHash = '0x682d7962ddf38b5083c386dbe4e950bb502491088ce422775d476a2ac12bb95d'
            const tx = await ethClient.exitERC721(burnHash,{
                from: from,
                legacyProof: true,
                parent: true,
            })
            console.log(`====exitTx====`, tx)

            // balance after exit
            const userBalanceAfterMain = await ethClient.balanceOfERC721(from, erc721MainToken, {parent:true})
            console.log(`====userBalanceAfterMain====`, userBalanceAfterMain)
            assert.equal(new BigNumber(userBalanceAfterMain).minus(userBalanceBeforeMain).toString(), 1)
            const ownerOfAfterMain = await ethClient.ownerOfERC721(erc721MainToken, tokenId, {parent:true})
            console.log(`====ownerOfAfterMain====`, ownerOfAfterMain)
            assert.equal(ownerOfAfterMain, from)
        })
    })
    // process.exit(0)
})