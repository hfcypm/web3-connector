import { ethers } from "ethers";
import type { Wallet } from "../types";

function isPhantomWalletInstalled(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }
    const win = window as any;
    const ethereum = win.ethereum;
    const phantom = win.phantom?.ethereum;
    return !!phantom || (!!ethereum && ethereum.isPhantom === true);
}

export const phantomConnector = async (): Promise<any> => {
    if (!isPhantomWalletInstalled()) {
        throw new Error('Phantom Wallet is not installed');
    }
    try {
        const win = window as any;
        // 获取原始的钱包扩展实例用于事件监听
        const phantomProvider = win.phantom?.ethereum || win.ethereum;

        const provider = new ethers.BrowserProvider(phantomProvider);
        const accounts = await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const balance = await provider.getBalance(address);
        const { chainId } = await provider.getNetwork();

        //初始化余额
        let lastBalance = balance;
        // 余额变化处理
        const handleBlock = async () => {
            const newBalance = await provider.getBalance(address);
            if (lastBalance !== newBalance) {
                lastBalance = newBalance;
                console.log('phantom wallet 区块变化，重新获取余额发送事件：', 'wallet-balance-changed', "balance:", newBalance);
                window.dispatchEvent(new CustomEvent('wallet-balance-changed', { detail: { balance: newBalance } }));
            }
        };
        provider.on('block', handleBlock);

        //监听用户切换的事件
        const handleAccountsChanged = (newAccounts: string[]) => {
            console.log('phantom 用户变化，发送事件：', 'wallet-connected');
            if (newAccounts.length === 0) {
                window.dispatchEvent(new CustomEvent('wallet-disconnected'));
            } else {
                window.dispatchEvent(new CustomEvent('wallet-connected'
                    , { detail: { account: newAccounts } }));
            }
        };
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        //监听区块链网络的切换事件
        const handleChainChanged = (newChainIDHex: string) => {
            const newChainId = parseInt(newChainIDHex);
            console.log('phantom 网络变化，发送事件：', 'wallet-chain-changed');
            window.dispatchEvent(new CustomEvent('wallet-chain-changed'
                , { detail: { chainId: newChainId } }));
        };
        window.ethereum.on('chainChanged', handleChainChanged);

        phantomProvider.on("disconnect", () => {
            window.dispatchEvent(new CustomEvent("wallet-disconnected"));
        });

        return {
            accounts,
            signer,
            address,
            chainId,
            provider,
            balance,
            disconnect: async () => {
                // 1. 清理 Ethers provider 的监听（包括 block）
                provider.removeAllListeners();
                // 2. 清理 MetaMask 的监听（包括 accountsChanged 和 chainChanged）
                window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
                window.ethereum.removeListener("chainChanged", handleChainChanged);
            },
        };
    } catch (error) {
        console.error('连接失败:', error);
        throw error;
    }
}

export const phantomWallet: Wallet = {
    id: 'phantom',
    name: 'Phantom',
    icon: new URL("../../assets/phantom.png", import.meta.url).href,
    connector: phantomConnector,
    description: 'Phantom is a secure, non-custodial wallet for Ethereum, Solana, and other blockchains.',
    installed: isPhantomWalletInstalled(),
    downloadLink: 'https://phantom.app/',
}