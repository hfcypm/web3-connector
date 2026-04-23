//弹窗中需要展示的钱包列表
export const showWallets = [
    {
        id: 'metamask',
        name: 'MetaMask',
        icon: 'https://assets.metamask.io/favicon.ico',
        //钱包连接器
        connector: () => Promise.resolve(),
        //钱包描述
        description: 'MetaMask is a browser extension that allows you to connect to Ethereum-based blockchains.',
        //是否安装
        installed: false,
        //下载链接
        downLoadLink: 'https://metamask.io/',
    }
]