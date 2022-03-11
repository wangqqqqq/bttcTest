const bn = require('bn.js')
const HDWalletProvider = require('@truffle/hdwallet-provider')
const config = require('./config')
const Network = require('@maticnetwork/meta/network')
const BttcPlasmaClient = require('../../dist/bttc.node.js').default
const TronWeb = require('tronweb')

//const { MaticPOSClient } = require('@maticnetwork/maticjs')

const { BttcPOSClient, TronWebClient } = require('../../dist/bttc.node.js')

const SCALING_FACTOR = new bn(10).pow(new bn(18))

const privateKey = config.user.privateKey
const userAddress = config.user.address

async function getBttcPlasmaClient(network = 'testnet', version = 'mumbai') {
  const networkInstance = new Network(network, version)
  const from = config.user1.address
  const matic = new BttcPlasmaClient({
    network: network,
    version: version,
    parentProvider: new HDWalletProvider(privateKey, config.parent.rpc),
    maticProvider: new HDWalletProvider(privateKey, config.child.rpc),
    parentDefaultOptions: { from: userAddress },
    maticDefaultOptions: { from: userAddress },

    // rootChain: config.plasma.rootChainAddress,
    // registry: config.plasma.registryAddress,
    // depositManager: config.plasma.depositManagerAddress,
    // withdrawManager: config.plasma.withdrawManagerAddress,
    // childChain: config.plasma.childChainAddress,
  })
  await matic.initialize()
  return { matic, network: networkInstance }
}

const getEthClient = (pKey, userAddr) => {
  return new BttcPOSClient({
    network: 'testnet', // For mainnet change this to mainnet
    version: 'mumbai', // For mainnet change this to v1
    parentProvider: new HDWalletProvider(pKey, config.parentETH.rpc),
    maticProvider: new HDWalletProvider(pKey, config.child.rpc),
    parentDefaultOptions: { from: userAddr },
    maticDefaultOptions: { from: userAddr },
    posRootChainManager: config.pos.ETH.chainManagerAddress,
    rootChain: config.pos.ETH.rootChain,
    // optional, required only if working with ERC20 tokens
    posERC20Predicate: config.pos.ETH.erc20Predicate,
    // // optional, required only if working with ERC721 tokens
    // posERC721Predicate: config.pos.parent.erc721Predicate,
    // // optional, required only if working with ERC71155 tokens
    // posERC1155Predicate: config.pos.parent.erc1155Predicate,
  })
}

const getBscClient = (pKey, userAddr) => {
  return new BttcPOSClient({
    network: 'testnet', // For mainnet change this to mainnet
    version: 'mumbai', // For mainnet change this to v1
    parentProvider: new HDWalletProvider(pKey, config.parentBSC.rpc),
    maticProvider: new HDWalletProvider(pKey, config.child.rpc),
    parentDefaultOptions: { from: userAddr },
    maticDefaultOptions: { from: userAddr },
    posRootChainManager: config.pos.BSC.chainManagerAddress,
    rootChain: config.pos.BSC.rootChain,
    // optional, required only if working with ERC20 tokens
    posERC20Predicate: config.pos.BSC.erc20Predicate,
    // // optional, required only if working with ERC721 tokens
    // posERC721Predicate: config.pos.parent.erc721Predicate,
    // // optional, required only if working with ERC71155 tokens
    // posERC1155Predicate: config.pos.parent.erc1155Predicate,
  })
}

const getTronWebClient = (pKey, userAddr) => {
  return new TronWebClient({
    network: 'testnet', // For mainnet change this to mainnet
    version: 'mumbai', // For mainnet change this to v1
    parentProvider: new HDWalletProvider(pKey, config.parentETH.rpc),
    maticProvider: new HDWalletProvider(pKey, config.child.rpc),
    parentDefaultOptions: { from: userAddr },
    maticDefaultOptions: { from: userAddr },
    rootChain: config.pos.TRON.rootChain,
    posRootChainManager: config.pos.TRON.chainManagerAddress,
    tronWebOptions: config.tronWebOptions,
  })
}

const getTronWebInstance = () => {
    return new TronWeb({
        fullNode: config.tronWebOptions.fullNode,
        solidityNode: config.tronWebOptions.solidityNode,
        eventServer: config.tronWebOptions.eventServer,
        privateKey: config.tronWebOptions.privateKey
    })
}


module.exports = {
  SCALING_FACTOR,
  getBttcPlasmaClient: getBttcPlasmaClient,
  getEthClient: getEthClient,
  getBscClient: getBscClient,
  getTronWebClient: getTronWebClient,
  getTronWebInstance: getTronWebInstance,
  child: config.child,
  plasma: config.plasma,
  pos: config.pos,
  user: config.user.address,
  privateKey: config.user.privateKey,
}
