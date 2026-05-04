import type { Wallet } from "../types";
import { ethers } from "ethers";

function isCoinbaseWalletInstalled() {
    return typeof window !== 'undefined' && typeof (window as any).coinbaseWalletExtension !== 'undefined';
}

export const coinbaseConnector = async (): Promise<any> => {
    try {
        //1.判断当前是否安装coinbase
        if (!isCoinbaseWalletInstalled()) {
            //coinbase钱包未正确安装
            throw new Error('Coinbase wallet is not installed');
        }
        //2.连接coninbase钱包 已安装
        //发起钱包授权连接
        const coinbaseWalletExtension = (window as any).coinbaseWalletExtension;
        const provider = new ethers.BrowserProvider(coinbaseWalletExtension);

        //请求连接账户
        const accounts = await provider.send('eth_requestAccounts', []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const balance = await provider.getBalance(address);
        const { chainId } = await provider.getNetwork();

        //监听用户切换的事件
        coinbaseWalletExtension.on('accountsChanged', (newAccounts: string[]) => {
            window.dispatchEvent(new CustomEvent('wallet_accounts_changed', { detail: { newAccounts } }));
        });
        //监听区块链网络的切换事件
        coinbaseWalletExtension.on('chainChanged', () => {
            window.dispatchEvent(new CustomEvent('wallet_chain_changed', { detail: { chainId } }));
        });
        //断开连接
        coinbaseWalletExtension.on('disconnect', (error: any) => {
            window.dispatchEvent(new CustomEvent('wallet_disconnected', { detail: error }));
        });
        console.log('coinbase info:::::', {
            accounts,
            signer,
            address,
            chainId,
            provider,
            balance,
        });
        return {
            accounts,
            signer,
            address,
            chainId,
            provider,
            balance,
            disconnect: async () => provider.removeAllListeners()
        };
    } catch (error) {
        console.error('Failed to connect to Coinbase Wallet:', error);
        throw error;
    }
}

export const coinbaseWallet: Wallet = {
    id: 'coinbase',
    name: 'Coinbase',
    icon: new URL("../../assets/coinbase.svg", import.meta.url).href,
    connector: coinbaseConnector,
    description: 'Coinbase Wallet is a secure, easy-to-use, and free app for accessing crypto on the Ethereum blockchain.',
    installed: isCoinbaseWalletInstalled(),
    downloadLink: 'https://www.coinbase.com/'
}