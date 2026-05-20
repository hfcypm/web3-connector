import { ethers } from "ethers";
import type { Wallet } from "../types";
import { useState } from "react";
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
        const balance = await provider.getBalance(address);
        const { chainId } = await provider.getNetwork();

        //初始化余额
        let lastBalance = balance;
        // 余额变化处理
        const handleBlock = async () => {
            const newBalance = await provider.getBalance(address);
            if (lastBalance !== newBalance) {
                lastBalance = newBalance;
                console.log('metamask 区块变化，重新获取余额发送事件：', 'wallet-balance-changed', "balance:", newBalance);
                window.dispatchEvent(new CustomEvent('wallet-balance-changed', { detail: { balance: newBalance } }));
            }
        };
        //监听余额变化事件
        provider.on('block', handleBlock);
        //监听用户切换的事件
        const handleAccountsChanged = (newAccounts: string[]) => {
            console.log('metamask 用户变化，发送事件：', 'wallet-connected');
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
            console.log('metamask 网络变化，发送事件：', 'wallet_chain_changed');
            window.dispatchEvent(new CustomEvent('wallet_chain_changed'
                , { detail: { chainId: newChainId } }));
        };
        window.ethereum.on('chainChanged', handleChainChanged);
        provider.on("disconnect", () => {
            window.dispatchEvent(new CustomEvent("wallet-disconnected"));
        });
        return {
            accounts, singer, chainId, address, balance,
            // 标准断开方法（清理所有监听）
            disconnect: async () => {
                // 1. 清理 Ethers provider 的监听（包括 block）
                provider.removeAllListeners();
                // 2. 清理 MetaMask 的监听（包括 accountsChanged 和 chainChanged）
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            },
        };
    } catch (error) {
        throw new Error('Failed to connect to MetaMask');
    }
}


export const metaMaskWallet: Wallet = {
    id: 'metamask',
    name: 'MetaMask',
    icon: new URL("../../assets/metamask.svg", import.meta.url).href,
    //钱包连接器
    connector: connectMetamask,
    //钱包描述
    description: 'MetaMask is a browser extension that allows you to connect to Ethereum-based blockchains.',
    //是否安装
    installed: false,
    //下载链接
    downloadLink: 'https://metamask.io/',
}