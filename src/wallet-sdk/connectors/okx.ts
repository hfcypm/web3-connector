import type { Wallet } from "../types";
import { ethers } from "ethers";


//判断okx钱包是否安装
function isOkxWalletInstalled() {
    if (typeof window === 'undefined') {
        return false;
    }
    const win = window as any;
    const ethereum = win.ethereum;
    const okxWallet = win.okxwallet;
    // 同时判断两种注入方式，100% 覆盖所有环境
    return !!okxWallet || (!!ethereum && ethereum.isOkxWallet === true);
}


//判断okx钱包连接器
export const okxConnector = async (): Promise<any> => {
    //1.判断是否安装了okx wallet
    if (!isOkxWalletInstalled()) {
        throw new Error('OKX Wallet is not installed');
    }
    try {
        //连接okx wallet
        // 1. 申请授权账号
        const win = window as any;
        const okxProvider = win.okxwallet || win.ethereum;

        // 2. 用 ethers 封装 Provider Ethers v6 标准用法
        const provider = new ethers.BrowserProvider(okxProvider);
        const accounts = await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const { chainId } = await provider.getNetwork();

        // 3. 监听用户切换的事件
        okxProvider.on("accountsChanged", (newAccounts: string[]) => {
            window.dispatchEvent(
                new CustomEvent("wallet_accounts_changed", {
                    detail: { account: newAccounts?.[0] || null },
                })
            );
        });
        // 4. 监听区块链网络的切换事件（事件名必须是 chainChanged）
        okxProvider.on("chainChanged", (chainId: string) => {
            window.dispatchEvent(
                new CustomEvent("wallet_chain_changed", {
                    detail: { chainId },
                })
            );
        });
        // 5. 断开连接
        okxProvider.on("disconnect", () => {
            window.dispatchEvent(new CustomEvent("wallet_disconnected"));
        });
        //打印当前连接信息
        console.log('okx wallet info:::::', {
            accounts,
            signer,
            address,
            chainId,
            provider,
        });
        return {
            accounts,
            signer,
            address,
            chainId,
            provider,
            // 标准断开方法（清理所有监听）
            disconnect: async () => {
                try {
                    okxProvider.removeAllListeners();
                    provider.removeAllListeners();
                } catch { }
            },
        };
    } catch (error) {
        console.error('连接失败:', error);
        throw error;
    }
}

export const okxWallet: Wallet = {
    id: 'okx',
    name: 'OKX Wallet',
    icon: 'https://static.okx.com/cdn/assets/imgs/247/58E63FEA47A2B7D7.png',
    //钱包连接器
    connector: okxConnector,
    //钱包描述
    description: 'OKX Wallet is a wallet for the OKX network blockchain.',
    //是否安装
    installed: isOkxWalletInstalled(),
    //下载链接
    downLoadLink: 'https://www.okx.com/',
}