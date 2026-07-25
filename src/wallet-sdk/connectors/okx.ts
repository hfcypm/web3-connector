import type { Wallet } from "../types";
import { handleWalletConnection } from "./_sharedwallet";
import { isOkxWalletInstalled } from "../utils/index"
import { toast } from "react-toastify";
import { CONNECTION_TIMEOUT_MS } from "../const/connection";

/**
 * OKX 连接器：
 * - 如果 window.ethereum 本身就是 OKX 注入的（isOkxWallet === true），优先用它，
 *   因为 ethereum 是 ethers 测试最充分的注入点，兼容性最好
 * - 否则使用 window.okxwallet 独立命名空间（避免被其他扩展占用 window.ethereum 时拿不到 OKX provider）
 * - 绝不兜底使用 window.ethereum，防止在多钱包环境下误连到 MetaMask 等其他钱包
 */
export const okxConnector = async () => {
    if (!isOkxWalletInstalled()) {
        toast.error("OKX Wallet is not installed. Please install OKX Wallet extension and try again.");
        throw new Error("OKX Wallet is not installed");
    }
    const provider = getOkxEip1193Provider();

    if (!provider) {
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
                CONNECTION_TIMEOUT_MS,
            );
        });
        //真正开始连接OKX钱包
        return await Promise.race([handleWalletConnection(provider, "okx"), timeoutPromise]);
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

/**
 * 精准获取OKX EIP1193 Provider（二种兜底方案，优先window.okxwallet）
 */
export const getOkxEip1193Provider = () => {
    // 方案1：优先OKX专属全局对象 window.okxwallet（官方标准注入）
    if (window.okxwallet && typeof window.okxwallet.request === "function") {
        return window.okxwallet;
    }

    // 方案2：多钱包场景从 window.ethereum.providers 筛选OKX（_isOkxWallet 下划线！）
    if (!window.ethereum) throw new Error("未安装任何EVM钱包");

    let okxProvider = null;
    // 存在providers数组=多钱包(MetaMask+OKX共存)
    if (Array.isArray(window.ethereum.providers)) {
        okxProvider = window.ethereum.providers.find((item: any) => !!item._isOkxWallet);
    } else {
        // 单钱包只注入window.ethereum，校验是否OKX
        if (window.ethereum._isOkxWallet) okxProvider = window.ethereum;
    }
    if (!okxProvider) throw new Error("未检测到OKX Web3钱包插件");
    return okxProvider;
}

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
