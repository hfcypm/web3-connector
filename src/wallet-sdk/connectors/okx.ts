import type { Wallet } from "../types";
import { handleWalletConnection } from "./_shared";
import { isOkxWalletInstalled } from "../utils/index"
import { toast } from "react-toastify";

// 连接超时时间（毫秒），超时后抛出错误避免无限等待
const CONNECT_TIMEOUT_MS = 15_000;

/**
 * OKX 连接器：
 * - 如果 window.ethereum 本身就是 OKX 注入的（isOkxWallet === true），优先用它，
 *   因为 ethereum 是 ethers 测试最充分的注入点，兼容性最好
 * - 否则使用 window.okxwallet 独立命名空间（避免被其他扩展占用 window.ethereum 时拿不到 OKX provider）
 * - ⚠️ 绝不兜底使用 window.ethereum，防止在多钱包环境下误连到 MetaMask 等其他钱包
 */
export const okxConnector = async () => {
    if (!isOkxWalletInstalled()) {
        toast.error("OKX Wallet is not installed. Please install OKX Wallet extension and try again.");
        throw new Error("OKX Wallet is not installed");
    }

    const win = window as any;
    const ethereum = win.ethereum;

    /**
     * 从 EIP-5749 多钱包 providers 数组中查找 OKX 的 provider。
     * 当多个钱包同时安装时（如 MetaMask + OKX），window.ethereum.providers
     * 包含所有已注入的 provider，通过 isOkxWallet 标志识别 OKX。
     */
    const findOkxProviderFromList = (): any => {
        if (ethereum && Array.isArray(ethereum.providers)) {
            return ethereum.providers.find((p: any) => p?.isOkxWallet) || null;
        }
        return null;
    };

    // Provider 选择优先级：
    // 1. window.ethereum 本身就是 OKX（OKX 是默认钱包，兼容性最好）
    // 2. window.ethereum.providers 中的 OKX provider（多钱包共存，EIP-5749）
    // 3. window.okxwallet 独立命名空间（OKX 旧版注入方式）
    // ⚠️ 绝不兜底使用 window.ethereum，防止在多钱包环境下误连到 MetaMask 等其他钱包
    const rawProvider =
        (ethereum?.isOkxWallet === true ? ethereum : null) ||
        findOkxProviderFromList() ||
        win.okxwallet;

    // 如果没有找到 OKX 专属的 provider，说明多钱包环境下
    // window.ethereum 被其他钱包（如 MetaMask）占用，且 OKX 的 provider 也找不到。
    if (!rawProvider) {
        toast.error(
            "OKX Wallet provider not found. " +
            "If you have multiple wallets installed, please set OKX Wallet as the default wallet in the extension settings."
        );
        throw new Error(
            "OKX Wallet provider not found. " +
            "window.ethereum is not OKX, no OKX provider in ethereum.providers, and window.okxwallet is not available. " +
            "Please set OKX as the default wallet or reinstall the OKX extension."
        );
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    try {
        // 加连接超时，避免 eth_requestAccounts 不响应导致无限等待
        const timeoutPromise = new Promise<never>((_, reject) => {
            timer = setTimeout(
                () => {
                    // 连接超时，提示用户检查钱包扩展
                    toast.error(
                        "OKX Wallet connection timed out. " +
                        "Please make sure the OKX Wallet extension is unlocked and the popup is not blocked by the browser."
                    );
                    reject(new Error(
                        "OKX Wallet connection timed out. Please check the wallet extension and try again."
                    ));
                },
                CONNECT_TIMEOUT_MS,
            );
        });

        const connectionPromise = handleWalletConnection(rawProvider, "okx");
        return await Promise.race([connectionPromise, timeoutPromise]);
    } catch (error) {
        console.error("Failed to connect to OKX Wallet:", error);
        throw error;
    } finally {
        // 确保连接完成后清除定时器，避免成功后误报超时
        if (timer !== null) {
            clearTimeout(timer);
        }
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
