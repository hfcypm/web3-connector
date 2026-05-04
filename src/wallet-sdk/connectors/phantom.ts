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
        const phantomExtension = win.phantom?.ethereum || win.ethereum;
        const phantomProvider = win.phantom?.ethereum || win.ethereum;

        const provider = new ethers.BrowserProvider(phantomProvider);
        const accounts = await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const balance = await provider.getBalance(address);
        const { chainId } = await provider.getNetwork();

        // 事件监听应该绑定到原始的钱包扩展实例
        phantomExtension.on("accountsChanged", (newAccounts: string[]) => {
            window.dispatchEvent(
                new CustomEvent("wallet_accounts_changed", {
                    detail: { account: newAccounts?.[0] || null },
                })
            );
        });

        phantomExtension.on("chainChanged", (chainId: string) => {
            window.dispatchEvent(
                new CustomEvent("wallet_chain_changed", {
                    detail: { chainId },
                })
            );
        });

        phantomExtension.on("disconnect", () => {
            window.dispatchEvent(new CustomEvent("wallet_disconnected"));
        });

        return {
            accounts,
            signer,
            address,
            chainId,
            provider,
            balance,
            disconnect: async () => {
                try {
                    // 清理原始扩展实例的监听器
                    phantomExtension.removeAllListeners?.();
                    // 清理provider的监听器
                    provider.removeAllListeners?.();
                } catch { }
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