import type { Wallet } from "../types";
import { setupWalletConnection } from "./_shared";

/**
 * 检测 OKX 钱包是否安装
 * OKX provider 注入位置有两种：
 *  1. window.okxwallet —— OKX 独立命名空间（即使 window.ethereum 被其他钱包占用也能拿到）
 *  2. window.ethereum.isOkxWallet —— 作为默认钱包时挂到 window.ethereum
 */
function isOkxWalletInstalled() {
    if (typeof window === "undefined") return false;
    const win = window as any;
    const ethereum = win.ethereum;
    const okxWallet = win.okxwallet;
    return !!okxWallet || (!!ethereum && ethereum.isOkxWallet === true);
}

/**
 * OKX 连接器：
 * 优先使用 window.okxwallet（避免被其他扩展覆盖 window.ethereum），
 * 兜底使用 window.ethereum。
 */
export const okxConnector = async () => {
    if (!isOkxWalletInstalled()) {
        throw new Error("OKX Wallet is not installed");
    }
    try {
        const win = window as any;
        const rawProvider = win.okxwallet || win.ethereum;
        return await setupWalletConnection(rawProvider, "okx");
    } catch (error) {
        console.error("Failed to connect to OKX Wallet:", error);
        throw error;
    }
};

// OKX 钱包元数据，供 WalletModal 渲染入口按钮
export const okxWallet: Wallet = {
    id: "okx",
    name: "OKX Wallet",
    icon: new URL("../../assets/okx.png", import.meta.url).href,
    connector: okxConnector,
    description: "OKX Wallet is a wallet for the OKX network blockchain.",
    installed: isOkxWalletInstalled(),
    downloadLink: "https://www.okx.com/",
};
