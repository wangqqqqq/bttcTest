const HashMap = require('hashmap') ;
const util = require('util');
var fs = require('fs')

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
                console.log("content: "+content)
                for(i in array) {
                    console.log("array[i]: "+array[i])
                    if (array[i].includes(content)) {
                        console.log("baohan")
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

module.exports = {
    write,
    find,
    remove
}

