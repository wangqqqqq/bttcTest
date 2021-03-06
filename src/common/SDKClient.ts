import Network from '@maticnetwork/meta/network'
import BN from 'bn.js'
import ContractsBase from '../common/ContractsBase'
import Web3Client from '../common/Web3Client'
import { address, SendOptions } from '../types/Common'

export default class SDKClient extends ContractsBase {
  static initializeNetwork(network = 'testnet', version = 'mumbai') {
    const _network = new Network(network, version)
    if (!_network) throw new Error(`network ${network} - ${version} is not supported`)
    return _network
  }

  constructor(options: any = {}) {
    const web3Client = new Web3Client(
      options.parentProvider || options.network.Main.RPC,
      options.maticProvider || options.network.Matic.RPC,
      options.parentDefaultOptions || {},
      options.maticDefaultOptions || {}
    )
    super(web3Client, options.network)
  }

  setWallet(_wallet) {
    this.web3Client.wallet = _wallet
  }

  async balanceOfEther(addr: address, options?: SendOptions){
    if (options && (!addr)) {
      throw new Error('user address is missing')
    }
    return this.getEtherBalance(addr,options.parent)
  }

  async balanceOfERC20(userAddress: address, token: address, options: SendOptions = {}) {
    if (!token || !userAddress) {
      throw new Error('token address or user address is missing')
    }
    const balance = this.getERC20TokenContract(token, options.parent)
      .methods.balanceOf(userAddress)
      .call()
    return balance
  }

  async balanceOfERC721(userAddress: address, token: address, options: SendOptions = {}) {
    if (options && (!token || !userAddress)) {
      throw new Error('token address or user address is missing')
    }

    const balance = this.getERC721TokenContract(token, options.parent)
      .methods.balanceOf(userAddress)
      .call()
    return balance
  }

  async tokenOfOwnerByIndexERC721(userAddress: address, token: address, index: number, options?: SendOptions) {
    if (options && (!token || !userAddress)) {
      throw new Error('token address or user address is missing')
    }

    const tokenID = this.getERC721TokenContract(token, options.parent)
      .methods.tokenOfOwnerByIndex(userAddress, index)
      .call()
    return tokenID
  }

  async isExistsMintERC721(token: address, tokenId: string, options?: SendOptions) {
    if (options && (!tokenId || !token)) {
      throw new Error('token or tokenId is missing')
    }

    const isExists = this.getParentMintERC721TokenContract(token, options.parent)
    .methods.exists(tokenId)
    .call()
    return isExists
  }

  async ownerOfERC721(token: address, tokenId: string, options?: SendOptions) {
    if (options && (!tokenId || !token)) {
      throw new Error('token or tokenId is missing')
    }

    const owner = this.getERC721TokenContract(token, options.parent)
    .methods.ownerOf(tokenId)
    .call()
    return owner
  }

  async mintERC20Token(token: address, amount: BN | string, options?: SendOptions) {
    if (options && (!options.from || !amount || !token)) {
      throw new Error('options.from, amount or token is missing')
    }

    const txObject = this.getParentERC20TokenContract(token, options.parent).methods.mint(amount)

    const onRootChain = options.parent ? true : false
    const web3Options = await this.web3Client.fillOptions(txObject, onRootChain, options)
    if (web3Options.encodeAbi) {
      return Object.assign(web3Options, { data: txObject.encodeABI(), to: token })
    }
    return this.web3Client.send(txObject, web3Options, options)
  }

  async mintERC20TokenTo(token: address, to: address, amount: BN | string, options?: SendOptions) {
    if (options && (!options.from || !to || !amount || !token)) {
      throw new Error('options.from, to, amount or token is missing')
    }

    const txObject = this.getParentMintERC20TokenContract(token, options.parent).methods.mint(to,amount)

    const onRootChain = options.parent ? true : false
    const web3Options = await this.web3Client.fillOptions(txObject, onRootChain, options)
    if (web3Options.encodeAbi) {
      return Object.assign(web3Options, { data: txObject.encodeABI(), to: token })
    }
    return this.web3Client.send(txObject, web3Options, options)
  }

  async transferERC20Tokens(token: address, to: address, amount: BN | string, options?: SendOptions) {
    if (options && (!options.from || !amount || !token || !to)) {
      throw new Error('options.from, to, token or amount is missing')
    }
    const txObject = this.getERC20TokenContract(token, options.parent).methods.transfer(to, this.encode(amount))
    const onRootChain = options.parent ? true : false
    const web3Options = await this.web3Client.fillOptions(txObject, onRootChain, options)
    if (web3Options.encodeAbi) {
      return Object.assign(web3Options, { data: txObject.encodeABI(), to: token })
    }
    return this.web3Client.send(txObject, web3Options, options)
  }

  async mintERC721Token(token: address, tokenId: string, options?: SendOptions) {
    if (options && (!options.from || !tokenId || !token)) {
      throw new Error('options.from, token or tokenId is missing')
    }

    const txObject = this.getParentERC721TokenContract(token, options.parent).methods.mint(tokenId)

    const onRootChain = options.parent ? true : false
    const web3Options = await this.web3Client.fillOptions(txObject, onRootChain, options)
    if (web3Options.encodeAbi) {
      return Object.assign(web3Options, { data: txObject.encodeABI(), to: token })
    }
    return this.web3Client.send(txObject, web3Options, options)
  }

  async mintERC721TokenTo(token: address, to: address, tokenId: string, options?: SendOptions) {
    if (options && (!options.from || !to || !tokenId || !token)) {
      throw new Error('options.from, to, token or tokenId is missing')
    }

    const txObject = this.getParentMintERC721TokenContract(token, options.parent).methods.mint(to, tokenId)
    const onRootChain = options.parent ? true : false
    const web3Options = await this.web3Client.fillOptions(txObject, onRootChain, options)
    if (web3Options.encodeAbi) {
      return Object.assign(web3Options, { data: txObject.encodeABI(), to: token })
    }
    return this.web3Client.send(txObject, web3Options, options)
  }

  async transferERC721Tokens(token: address, to: address, tokenId: string, options?: SendOptions) {
    if (options && (!options.from || !tokenId || !token || !to)) {
      throw new Error('options.from, to, token or tokenId is missing')
    }

    const txObject = this.getERC721TokenContract(token, options.parent).methods.transferFrom(options.from, to, tokenId)
    const onRootChain = options.parent ? true : false
    const web3Options = await this.web3Client.fillOptions(txObject, onRootChain, options)
    if (web3Options.encodeAbi) {
      return Object.assign(web3Options, { data: txObject.encodeABI(), to: token })
    }
    return this.web3Client.send(txObject, web3Options, options)
  }

  async transferMaticEth(to: address, amount: BN | string, options?: SendOptions) {
    if (options && (!options.from || !amount || !to)) {
      throw new Error('options.from, to or amount is missing')
    }
    const token = ContractsBase.MATIC_CHILD_TOKEN
    const txObject = this.getChildMaticContract().methods.transfer(to, this.encode(amount))
    options.value = this.encode(amount)
    const web3Options = await this.web3Client.fillOptions(txObject, false /* onRootChain */, options)
    if (web3Options.encodeAbi) {
      return Object.assign(web3Options, { data: txObject.encodeABI(), to: token })
    }
    return this.web3Client.send(txObject, web3Options, options)
  }
}
