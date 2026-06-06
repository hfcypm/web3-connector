import type { Wallet } from "../types";
import { handleWalletConnection } from "./_sharedwallet";
import { toast } from "react-toastify";

// 连接超时时间（毫秒），超时后抛出错误避免无限等待
const CONNECT_TIMEOUT_MS = 15_000;

/**
 * 检测 Phantom 钱包是否安装（仅检测 EVM 能力）
 * Phantom 是多链钱包，EVM provider 注入位置有三种：
 *  1. window.phantom.ethereum —— Phantom 命名空间下的 EVM provider
 *  2. window.ethereum.isPhantom —— 作为默认钱包时挂到 window.ethereum
 *  3. window.ethereum.providers[] —— 多钱包共存时（EIP-5749 兼容数组），查找其中的 Phantom provider
 */
function isPhantomWalletInstalled(): boolean {
    if (typeof window === "undefined") return false;
    const win = window as any;
    const ethereum = win.ethereum;
    const phantom = win.phantom?.ethereum;
    if (!!phantom) return true;
    if (!!ethereum && ethereum.isPhantom === true) return true;
    // 多钱包共存时，window.ethereum 会暴露 providers 数组
    if (ethereum && Array.isArray(ethereum.providers)) {
        return ethereum.providers.some((p: any) => p?.isPhantom);
    }
    return false;
}

/**
 * Phantom 连接器：
 * - 优先使用 window.phantom.ethereum（避免被其他扩展覆盖 window.ethereum）
 * - 其次从 window.ethereum.providers[] 中查找 Phantom provider（多钱包共存）
 * - ⚠️ 绝不兜底使用 window.ethereum，防止在多钱包环境下误连到 MetaMask 等其他钱包
 */
export const phantomConnector = async () => {
    if (!isPhantomWalletInstalled()) {
        toast.error("Phantom Wallet is not installed. Please install Phantom Wallet extension and try again.");
        throw new Error("Phantom Wallet is not installed");
    }

    const win = window as any;
    const ethereum = win.ethereum;

    /**
     * 从 EIP-5749 多钱包 providers 数组中查找 Phantom 的 provider。
     * 当多个钱包同时安装时（如 MetaMask + Phantom），window.ethereum.providers
     * 包含所有已注入的 provider，通过 isPhantom 标志识别 Phantom。
     */
    const findPhantomProviderFromList = (): any => {
        if (ethereum && Array.isArray(ethereum.providers)) {
            return ethereum.providers.find((p: any) => p?.isPhantom) || null;
        }
        return null;
    };

    // Provider 选择优先级：
    // 1. window.phantom.ethereum（Phantom 独立命名空间，最可靠）
    // 2. window.ethereum.providers 中的 Phantom provider（多钱包共存，EIP-5749）
    // 3. window.ethereum 本身就是 Phantom（Phantom 是默认钱包）
    // ⚠️ 绝不兜底直接使用 window.ethereum，防止在多钱包环境下误连到 MetaMask
    const rawProvider =
        win.phantom?.ethereum ||
        findPhantomProviderFromList() ||
        (ethereum?.isPhantom === true ? ethereum : null);

    if (!rawProvider) {
        toast.error(
            "Phantom Wallet provider not found. " +
            "If you have multiple wallets installed, please set Phantom as the default wallet in the extension settings."
        );
        throw new Error(
            "Phantom Wallet provider not found. " +
            "window.phantom.ethereum is not available, no Phantom provider in ethereum.providers, and window.ethereum is not Phantom. " +
            "Please set Phantom as the default wallet or reinstall the Phantom extension."
        );
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    try {
        const timeoutPromise = new Promise<never>((_, reject) => {
            timer = setTimeout(
                () => {
                    toast.error(
                        "Phantom Wallet connection timed out. " +
                        "Please make sure the Phantom Wallet extension is unlocked and the popup is not blocked by the browser."
                    );
                    reject(new Error(
                        "Phantom Wallet connection timed out. Please check the wallet extension and try again."
                    ));
                },
                CONNECT_TIMEOUT_MS,
            );
        });

        const connectionPromise = handleWalletConnection(rawProvider, "phantom");
        return await Promise.race([connectionPromise, timeoutPromise]);
    } catch (error) {
        console.error("Failed to connect to Phantom:", error);
        throw error;
    } finally {
        if (timer !== null) {
            clearTimeout(timer);
        }
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
