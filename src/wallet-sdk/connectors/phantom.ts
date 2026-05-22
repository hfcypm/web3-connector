import type { Wallet } from "../types";
import { setupWalletConnection } from "./_shared";

/**
 * 检测 Phantom 钱包是否安装（仅检测 EVM 能力）
 * Phantom 是多链钱包，EVM provider 注入位置有两种：
 *  1. window.phantom.ethereum —— Phantom 命名空间下的 EVM provider
 *  2. window.ethereum.isPhantom —— 作为默认钱包时挂到 window.ethereum
 */
function isPhantomWalletInstalled(): boolean {
    if (typeof window === "undefined") return false;
    const win = window as any;
    const ethereum = win.ethereum;
    const phantom = win.phantom?.ethereum;
    return !!phantom || (!!ethereum && ethereum.isPhantom === true);
}

/**
 * Phantom 连接器：
 * 优先使用 window.phantom.ethereum（避免被其他扩展覆盖 window.ethereum），
 * 兜底使用 window.ethereum。
 */
export const phantomConnector = async () => {
    if (!isPhantomWalletInstalled()) {
        throw new Error("Phantom Wallet is not installed");
    }
    try {
        const win = window as any;
        const rawProvider = win.phantom?.ethereum || win.ethereum;
        return await setupWalletConnection(rawProvider, "phantom");
    } catch (error) {
        console.error("Failed to connect to Phantom:", error);
        throw error;
    }
};

// Phantom 钱包元数据，供 WalletModal 渲染入口按钮
export const phantomWallet: Wallet = {
    id: "phantom",
    name: "Phantom",
    icon: new URL("../../assets/phantom.png", import.meta.url).href,
    connector: phantomConnector,
    description:
        "Phantom is a secure, non-custodial wallet for Ethereum, Solana, and other blockchains.",
    installed: isPhantomWalletInstalled(),
    downloadLink: "https://phantom.app/",
};
