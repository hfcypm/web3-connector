import { ethers } from "ethers";
import type { Wallet } from "../types";

//连接metaMask wallet
const connectMetamask = async (): Promise<any> => {

    //1.判断是否安装了metamask
    if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
    }

    try {
        //2.获取用户信息
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (!accounts || accounts.length === 0) {
            throw new Error('No account found');
        }
        //3.根据ethers获取地址及签名信息 主要provider
        const provider = new ethers.BrowserProvider(window.ethereum);
        const singer = await provider.getSigner();
        const address = await singer.getAddress();
        const { chainId } = await provider.getNetwork();
        //监听用户切换的事件
        window.ethereum.on('accountsChanged', (newAccounts: string[]) => {
            if (newAccounts.length === 0) {
                window.dispatchEvent(new CustomEvent('wallet-disconnected'));
            } else {
                window.dispatchEvent(new CustomEvent('wallet-connected'
                    , { detail: { account: newAccounts } }));
            }
        });
        //监听区块链网络的切换事件
        window.ethereum.on('chainChanged', (newChainIDHex: string) => {
            const newChainId = parseInt(newChainIDHex);
            window.dispatchEvent(new CustomEvent('wallet_chain_changed'
                , { detail: { chainId: newChainId } }));
        });
        return { accounts, singer, chainId, address };
    } catch (error) {
        throw new Error('Failed to connect to MetaMask');
    }
}


export const metaMaskWallet: Wallet = {
    id: 'metamask',
    name: 'MetaMask',
    icon: 'https://assets.metamask.io/favicon.ico',
    //钱包连接器
    connector: connectMetamask,
    //钱包描述
    description: 'MetaMask is a browser extension that allows you to connect to Ethereum-based blockchains.',
    //是否安装
    installed: false,
    //下载链接
    downLoadLink: 'https://metamask.io/',
}