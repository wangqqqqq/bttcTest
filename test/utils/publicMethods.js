const { getTronWebInstance } = require('./utils')
const HashMap = require('hashmap') ;
const util = require('util');
var fs = require('fs')
const tronWeb = getTronWebInstance()

/**
 * @param content
 * 721  bsc-merc721BurnHash:xxx,tokenId:xxx
 * 20   bsc-merc20BurnHash:xxx,tokenAmount:xxx
 */
const write = async (content) => {
    return new Promise((resolve,reject)=> {
        fs.writeFile('./burnRecord', '\n'+content,{ 'flag': 'a' }, function(error) {
            if (error){
                console.log('写入记录失败')
                return resolve(false);
            } else {
                return resolve(true);
            }
        })
    })
}

const find = async (content) => {
    return new Promise((resolve,reject)=> {
        let map = new HashMap();
        fs.readFile('./burnRecord', function (error, data) {
            if (error) {
                console.log('读取记录失败')
            } else {
                const array = data.toString().split("\n");
                for (i in array) {
                    if (array[i].includes(content)) {
                        const res1 = array[i].toString().split(":")
                        const res2 = res1[1].split(",")
                        map.set("hash", res2[0])
                        map.set(res2[1], res1[2])
                        break;
                    }
                }
            }
            return resolve(map);
        })
    })
}

const remove = async (content) => {
    return new Promise((resolve,reject)=> {
        fs.readFile('./burnRecord', function (error, data) {
            if (error) {
                console.log('读取记录失败')
            } else {
                const array = data.toString().split("\n")
                for(i in array) {
                    if (array[i].includes(content)) {
                        const newData = data.toString().replace(array[i],'')
                        fs.writeFile('./burnRecord', newData, function(error) {
                            if (error){
                                console.log('删除记录失败')
                            }
                        })
                        return resolve(true);
                    }
                }
            }
            return resolve(true);
        })
    })
}

const broadcaster = async (func, pk, transaction) => {
    if( !transaction) {
        transaction = await func;
    }
    // console.log("transaction:"+util.inspect(transaction))
    const signedTransaction = await tronWeb.trx.sign(transaction, pk);
    // console.log("signedTransaction:"+util.inspect(signedTransaction))
    let result = {
        transaction,
        signedTransaction,
        receipt: await tronWeb.trx.sendRawTransaction(signedTransaction)
    };

    let times = 0;
    while (times++ <= 10 && result.receipt.toString().indexOf("code") != -1 &&
    result.receipt.code == "SERVER_BUSY") {
        console.log("retry num is " + times);
        result = {
            transaction,
            signedTransaction,
            receipt: await tronWeb.trx.sendRawTransaction(signedTransaction)
        };
        await wait(1);
    }
    return Promise.resolve(result);
}

const to64Bytes = async (str) =>{
    let num = tronWeb.toHex(str)
    num = num.replace('0x', '')
    const l = num.length;
    let sres = "0x";
    for (var i =0 ; i < 64 -l;i++ ){
        sres +="0";
    }
    sres += num;
    return sres;
}

module.exports = {
    write,
    find,
    remove,
    broadcaster,
    to64Bytes
}

