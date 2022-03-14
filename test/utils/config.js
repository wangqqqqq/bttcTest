// Testnet V3 config
module.exports = {
  parentETH: {
    rpc: 'https://rpc.goerli.mudit.blog/',
  },
  parentBSC: {
    rpc: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    // rpc: 'https://bsc-dataseed.binance.org/',
  },
  child: {
    // rpc: 'http://47.253.57.11:8545', // This is the bttc testnet RPC
    rpc: 'https://test1-rpc.bittorrentchain.io', // This is the bttc testnet RPC
    // rpc: 'http://54.241.235.101:8545', // This is the bttc testnet RPC
    // rpc: 'http://54.226.46.103:8545', // This is the bttc testnet RPC
  },

  pos: {
    TRON: {
      chainManagerAddress: 'TC7eV5sBCL1BsUBbNweWKxTxbsCoUUs2U6', // Address of RootChainManagerProxy
      rootChain: 'THqMuJHeBKYQ1yF9HG7qfyCvELZKYAvwTC', // Address of RootChainProxy

      trxMain:'0xff00000000000000000000000000000000000001',
      trxSide:'0x555731d4118d92be327f8747d6e85f22d8194802',

      erc20Main: '0x877512DEB5ED8061624C72A2441A4F12FC2A73D0',// BTT
      erc20Side: '0x0000000000000000000000000000000000001010',// BTT

      merc20Main: '0xEA7DF080AFE2FDC6CAE509A237317DA90994890E',
      merc20Side: '0xfB01238F23c4aC473bC38222d7c54D0129c88eBA',

      erc721Main: '0x8961103F2853AADF4071DD0DA3B500B67D902190',
      erc721Side: '0x7411a936dC77E4909D84734ecB2608df5C0e769B',

      merc721Main: '0x2FA5B0E4CD227A914293EAD542DF3A5EB064B2C5',
      merc721Side: '0x3af62930173773403E66D8489718e86D3935A6bb',

      etherPredicate: 'TQTtCPLNFjhZXTSHWbgo7gq9kYRwGNma9F',
      erc20Predicate: 'TWmPxvPTCErg6bor9L4GGznxbtVnVVXggw',
      merc20Predicate: 'TAJdHZM1m4sNvftDU8wVddouW8wRB9kXdU',
      erc721Predicate: 'TVWx8w5tkwtKQA5TuQN2RszTx46wp4ZCor',
      merc721Predicate: 'TKCn7HNHC5iG7mMjrmqrSKLbdcV6aWrzeT',

    },
    ETH: {
      chainManagerAddress: '0x7b2d087a35d9c465b88c4cdde3ca086fea78ce67', // Address of RootChainManagerProxy
      rootChain: '0xcbb0283e103821fd96116dea52690b802f26712d', // Address of RootChainProxy

      ethMain:'0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      ethSide:'0x871df0b76dcff5adf966da2286eea61911655ec4',

      erc20Main: '0xa09ebFA5c71a6E2faec8d5D6e31d6e1D5ab0136c',
      erc20Side: '0x4fEe5fB6554EA6d456C02628728152cF9761a2ba',

      merc20Main: '0xa410e83987ebe5dfb7e05e7adc023376ef3031e8',// BTT
      merc20Side: '0x6409c82a87a6ccfcc7d3097d24c7d607c67a2cae',// BTT

      erc721Main: '0xc49DB5988c78452A81b510E4365eEA106870c00E',
      erc721Side: '0x1E70fBd0BcE9BAf63637Dc2DD7A6c54D55e6CA4b',

      merc721Main: '0x9a02cD3DC8A3569410Ae61C94b40758215e8aF73',
      merc721Side: '0xE9638Fa360C252c837c07dBFc7553B6440b431d7',

      etherPredicate: '0xde681417f0f10758905cae996682298aa8180a85',
      erc20Predicate: '0x407c34ae4ffd6861e05db43c07a8145ab935658c',
      merc20Predicate: '0xe92ba619c59db265e41a50c2a6a8dd1c0fa19066',
      erc721Predicate: '0x9035da0f88b9ef5b471b7aa02e82cb4bbcc65642',
      merc721Predicate: '0x7aca8f0d68b8dcea6553ecbfee55056727c136a8',

    },
    BSC: {
      chainManagerAddress: '0xba46e673224215be204e0752524b6c3da36f9664', // Address of RootChainManagerProxy
      rootChain: '0xce08027af1c8c719dafb4a6beb0d4c95b459237d', // Address of RootChainProxy

      bnbMain:'0xff00000000000000000000000000000000000002',
      bnbSide:'0xa9afb96c4778794dd0a30ce287c5e94ca6eaf419',

      erc20Main: '0x13f033B803615B88A28B1671dEcdA8C7bbDC0924',
      erc20Side: '0xC5aa114EBD8046D5Ce16589F69D04455BEF98Cab',

      merc20Main: '0xD5223388B59bE243722a385c9eA6F63A32Bc62A8',// BTT
      merc20Side: '0xcc2a5cdc79350444e71e7a5bc08408ae06331fe9',// BTT

      erc721Main: '0x57a16b561b2fA3203402d51D2c389D7E8af516A7',
      erc721Side: '0xe5971B050A2D1A5B8cBF117f57dd2692af7f0d65',

      merc721Main: '0x55693832a4dB5f12174Ad34b55ab68C24fF60f39',
      merc721Side: '0x358e6e0E3A6763729BaA739a38393a04d201c625',

      etherPredicate: '0xbce2bd86eb621fa5aee12161b42c424b782d31b7',
      erc20Predicate: '0x2eb91efc930e077c5fd2869d952d244ea90e6531',
      merc20Predicate: '0xdfb851d48d48270bf6f4489155aa4c70aa99674c',
      erc721Predicate: '0x8f9f0e3ff45fb47996daa2f06a70d3ce8aec9d1a',
      merc721Predicate: '0xb341e20dab6c6fdbe74a583b22c4dbd251d5040d',

    },
  },
  SYNCER_URL: '', // Backend service which syncs the Bttc sidechain state to a MySQL database which we use for faster querying. This comes in handy especially for constructing withdrawal proofs while exiting assets from Plasma.
  WATCHER_URL: '', // Backend service which syncs the Bttc Plasma contract events on Ethereum mainchain to a MySQL database which we use for faster querying. This comes in handy especially for listening to asset deposits on the Plasma contract.
  user: {
    privateKey: '33b343db0027b39b663aa1fcefebb7c45412be99ef1e3ca0fe681ab549336e58',
    address: '0x05D422bEdda173A98e23B4684ebE78d03C9dA2eC',
  },
  contractOwnerTRON: {
    privateKey: '4df12b6b37734c521eadc4ce5811f27f40e8bae8d43d32804dbf580d40aebcd7',
    address: '0x4698CA96DD198AE04E6C45B199516C17C31DBC95',
  },
  contractOwnerETHBSC: {
    privateKey: '69f68f5584960f1d7e153f29b76b04e9b449754e5e1ee8c3fca318adb0637462',
    address: '0x60F68C9B9E505946CF5102378FB55F07B812B819',
  },
  tronWebOptions: {
    privateKey: '33b343db0027b39b663aa1fcefebb7c45412be99ef1e3ca0fe681ab549336e58',
    address: 'TAW2WU2HZhCMsiDaLjHy3w2ksgCRNAhyya', // A sample address prefix with `T`
    fullNode: 'https://api.nileex.io',
    solidityNode: 'https://api.nileex.io',
    eventServer: 'https://event.nileex.io',
    // fullNode: 'https://api.trongrid.io',
    // solidityNode: 'https://api.trongrid.io',
    // eventServer: 'https://event.trongrid.io',
  },
}
