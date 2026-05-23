import type { Wallet } from "../types";
import { setupWalletConnection } from "./_shared";
import { isOkxWalletInstalled } from "../utils/index"
import { toast } from "react-toastify";

// 连接超时时间（毫秒），超时后抛出错误避免无限等待
const CONNECT_TIMEOUT_MS = 15_000;

/**
 * OKX 连接器：
 * - 如果 window.ethereum 本身就是 OKX 注入的（isOkxWallet === true），优先用它，
 *   因为 ethereum 是 ethers 测试最充分的注入点，兼容性最好
 * - 否则使用 window.okxwallet 独立命名空间（避免被其他扩展占用 window.ethereum 时拿不到 OKX provider）
 * - 最后兜底使用 window.ethereum
 */
export const okxConnector = async () => {
    if (!isOkxWalletInstalled()) {
        toast.error("OKX Wallet is not installed.");
        throw new Error("OKX Wallet is not installed");
    }
    let timer: any = null;
    try {
        const win = window as any;
        const ethereum = win.ethereum;
        // 如果 window.ethereum 就是 OKX 的，直接用（兼容性最好）
        // 否则优先用 okxwallet 独立命名空间
        const rawProvider =
            (ethereum?.isOkxWallet === true ? ethereum : null) ||
            win.okxwallet ||
            ethereum;

        // 加连接超时，避免 eth_requestAccounts 不响应导致无限等待
        const timeoutPromise = new Promise<never>((_, reject) =>
            timer = setTimeout(
                () => {
                    // 连接超时，提示用户检查钱包扩展
                    toast.error("OKX Wallet connection timed out.");
                    reject(new Error("OKX Wallet connection timed out. Please check the wallet extension and try again."));
                },
                CONNECT_TIMEOUT_MS,
            ),
        );
        const connectionPromise = setupWalletConnection(rawProvider, "okx");
        return await Promise.race([connectionPromise, timeoutPromise]);
    } catch (error) {
        console.error("Failed to connect to OKX Wallet:", error);
        throw error;
    } finally {
        //确保连接完成后清除定时器，避免成功后误报超时
        clearTimeout(timer);
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
