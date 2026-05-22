import type { Wallet } from "../types";
import { setupWalletConnection } from "./_shared";

/**
 * 检测 Coinbase Wallet 是否安装
 * 三种注入方式都要兼容：
 *  1. window.coinbaseWalletExtension —— 旧版扩展直接挂载的 provider
 *  2. window.ethereum.isCoinbaseWallet —— 新版作为默认钱包注入到 window.ethereum
 *  3. window.ethereum.providers[] —— 多钱包共存时（EIP-1193 兼容数组）
 */
function isCoinbaseWalletInstalled() {
    if (typeof window === "undefined") return false;
    const win = window as any;
    if (win.coinbaseWalletExtension) return true;
    const eth = win.ethereum;
    if (!eth) return false;
    if (eth.isCoinbaseWallet) return true;
    // 当 MetaMask 与 Coinbase 同时安装时，window.ethereum 会暴露 providers 数组
    if (Array.isArray(eth.providers)) {
        return eth.providers.some((p: any) => p?.isCoinbaseWallet);
    }
    return false;
}

/**
 * 在多 provider 共存场景下，从 window.ethereum 中挑出真正的 Coinbase provider，
 * 否则回退到 coinbaseWalletExtension / window.ethereum 本身。
 */
function getCoinbaseProvider(): any {
    const win = window as any;
    const eth = win.ethereum;
    if (eth?.providers && Array.isArray(eth.providers)) {
        const cb = eth.providers.find((p: any) => p?.isCoinbaseWallet);
        if (cb) return cb;
    }
    if (eth?.isCoinbaseWallet) return eth;
    // 兜底：旧版扩展只暴露这个对象
    return win.coinbaseWalletExtension ?? eth;
}

/**
 * Coinbase Wallet 连接器：
 * 解析出真正的 Coinbase provider 后，复用 _shared 中的统一连接逻辑。
 */
export const coinbaseConnector = async () => {
    if (!isCoinbaseWalletInstalled()) {
        throw new Error("Coinbase wallet is not installed");
    }
    try {
        const rawProvider = getCoinbaseProvider();
        return await setupWalletConnection(rawProvider, "coinbase");
    } catch (error) {
        console.error("Failed to connect to Coinbase Wallet:", error);
        throw error;
    }
};

// Coinbase 钱包元数据，供 WalletModal 渲染入口按钮
export const coinbaseWallet: Wallet = {
    id: "coinbase",
    name: "Coinbase",
    icon: new URL("../../assets/coinbase.svg", import.meta.url).href,
    connector: coinbaseConnector,
    description:
        "Coinbase Wallet is a secure, easy-to-use, and free app for accessing crypto on the Ethereum blockchain.",
    installed: isCoinbaseWalletInstalled(),
    downloadLink: "https://www.coinbase.com/",
};
