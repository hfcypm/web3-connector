import type { Wallet } from "../types";
import { handleWalletConnection } from "./_sharedwallet";
import { isMetaMaskInstalled } from "../utils";
import { CONNECTION_TIMEOUT_MS } from "../const/connection";

/**
 * MetaMask 连接器：
 * MetaMask 注入的 provider 始终挂在 window.ethereum 上，因此直接复用即可。
 * 真正的连接 / 监听 / 余额轮询逻辑在 _shared.setupWalletConnection 中。
 */
const connectMetamask = async () => {
    if (!isMetaMaskInstalled()) {
        throw new Error("MetaMask is not installed");
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    try {
        // provider
        const provider = window.ethereum;
        // 加连接超时，避免 eth_requestAccounts 不响应导致无限等待
        const timeoutPromise = new Promise((_, reject) => {
            timer = setTimeout(() => {
                reject(new Error("MetaMask connection timeout"));
            }, CONNECTION_TIMEOUT_MS);
        });
        return Promise.race([timeoutPromise, handleWalletConnection(provider, "metamask")]);
    } catch (error) {
        console.error("Failed to connect to MetaMask:", error);
        // 统一抛出 Error 实例，方便上层 catch 后读取 message
        throw error instanceof Error ? error : new Error("Failed to connect to MetaMask");
    }
};

// MetaMask 钱包元数据，供 WalletModal 渲染入口按钮
export const metaMaskWallet: Wallet = {
    id: "metamask",
    name: "MetaMask",
    icon: new URL("../../assets/metamask.svg", import.meta.url).href,
    connector: connectMetamask,
    description:
        "MetaMask is a browser extension that allows you to connect to Ethereum-based blockchains.",
    installed: false,
    downloadLink: "https://metamask.io/",
};
