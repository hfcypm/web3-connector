import { ethers } from "ethers";
import { toast } from "react-toastify";
import { getBalanceFast } from "./okx_balance";
import { parseChainId } from "../utils";

// ─── 全局钱包事件名称常量 ───────────────────────────────────────────────────────
// 所有 connector 统一通过 window.dispatchEvent 派发这些自定义事件，
// WalletProvider 统一监听，从而解耦 connector 与 React 状态层。
export const WALLET_EVENTS = {
    connected: "wallet-connected",       // 账户切换 / 重新授权后触发
    disconnected: "wallet-disconnected", // 钱包主动断开时触发
    chainChanged: "wallet-chain-changed",  // 用户在钱包内切换网络时触发
    balanceChanged: "wallet-balance-changed", // 轮询到余额变化时触发
} as const;

// 余额轮询间隔（毫秒）。15 秒轮询一次，兼顾实时性与 RPC 请求压力。
const POLL_INTERVAL_MS = 15_000;

// ─── setupWalletConnection 返回值类型 ──────────────────────────────────────────
export interface ConnectionResult {
    /** 当前授权的账户地址列表（通常只有一个） */
    accounts: string[];
    /** ethers Signer，可直接用于签名 / 发送交易 */
    signer: ethers.JsonRpcSigner;
    /** 当前账户的 checksum 地址 */
    address: string;
    /** 当前链 ID（bigint，原始值） */
    chainId: bigint;
    /** ethers BrowserProvider 实例，可用于只读 RPC 调用 */
    provider: ethers.BrowserProvider;
    /** 连接时查询到的初始余额（wei，bigint） */
    balance: bigint;
    /** 手动触发一次余额刷新；如果余额有变化会派发 balanceChanged 事件 */
    refreshBalance: () => Promise<void>;
    /** 断开连接并清理所有事件监听、轮询计时器 */
    disconnect: () => Promise<void>;
    /** 发起转账交易 */
    sendTransaction: (tx: ethers.TransactionRequest) => Promise<ethers.TransactionReceipt | null>;
    /** 
     * 交易监听事件(适用于 ERC-20 转账、合约调用等  消耗 gas)
     * 确认后自动刷新原生币余额。
     */
    watchTransaction: (txHash: string, confirmations?: number) => Promise<ethers.TransactionReceipt | null>;
    /** 用户连接传的入的provider 用于多钱包连接时-网络切换获取当前的provider */
    rawProvider: any;
}

/**
 * 通用钱包连接逻辑
 *
 * 接收任意符合 EIP-1193 规范的 rawProvider（如 window.ethereum），完成以下工作：
 *  1. 通过 eth_requestAccounts 弹出授权
 *  2. 获取账户地址、初始余额、当前链 ID
 *  3. 注册 accountsChanged / chainChanged / disconnect 事件监听
 *  4. 启动余额轮询（页面隐藏时暂停，重新可见时恢复）
 *  5. 返回 ConnectionResult，供上层 React Provider 消费
 *
 * @param rawProvider  EIP-1193 provider 对象
 * @param walletName   钱包名称，仅用于 console 日志前缀
 */
export async function handleWalletConnection(
    rawProvider: any,
    walletName: string,
): Promise<ConnectionResult> {
    console.log(`[${walletName}] --------开始连接-----------`);
    // 用 rawProvider 构造 ethers BrowserProvider，后续所有 RPC 调用都走这里
    let provider = new ethers.BrowserProvider(rawProvider);

    // 弹出授权弹窗，用户同意后返回授权地址列表
    const accounts: string[] = await provider.send("eth_requestAccounts", []);

    // 获取 Signer（包含私钥签名能力的对象）及其地址
    let signer = await provider.getSigner();
    let currentAddress = await signer.getAddress();
    console.log(`[${walletName}] --------连接成功-------address: ${currentAddress}`);

    // 单独处理 OKX 钱包的特殊余额查询逻辑
    let initialBalance = 0n;
    const isOkxWallet = rawProvider.isOKExWallet;
    console.log(`[${walletName}] --------是否OKX钱包-----------: ${isOkxWallet}`);

    if (isOkxWallet) {
        console.log(`[${walletName}] --------开始查询okx初始余额-----------`);
        initialBalance = await rawProvider.request({
            method: "eth_getBalance",
            params: [currentAddress, "latest"],
        });
    } else {
        initialBalance = await provider.getBalance(currentAddress);
    }
    // 获取当前链 ID
    const { chainId } = await provider.getNetwork();

    // ── 余额轮询相关状态 ──────────────────────────────────────────────────────
    // lastBalance 用于差分比较，避免无变化时重复 dispatch 事件
    let lastBalance: bigint = initialBalance;
    // 轮询计时器 ID；null 表示当前未在轮询
    let pollTimer: number | null = null;
    // disposed 标志：disconnect() 调用后置 true，阻止后续异步回调继续执行
    let disposed = false;

    /**
     * 拉取最新余额，若与上次不同则派发 balanceChanged 事件。
     * 所有调用路径（轮询 / 切链 / 外部手动触发）都走这个函数。
     */
    const refreshBalance = async () => {
        if (disposed) return;

        const requestAddress = currentAddress;
        try {
            //根据地址获取最新balance(okx 获取原生余额需要单独方法处理 )
            const next = isOkxWallet ? await getBalanceFast(rawProvider, requestAddress)
                : await provider.getBalance(requestAddress);

            // 请求返回时账号已切换，忽略旧账号结果 类型判断加toLowerCase()
            if (requestAddress.toLowerCase() !== currentAddress.toLowerCase()) {
                return;
            }

            if (next !== lastBalance) {
                lastBalance = next;
                // 派发全局自定义事件，WalletProvider 监听后更新 React state
                window.dispatchEvent(
                    new CustomEvent(WALLET_EVENTS.balanceChanged, {
                        detail: { balance: next, address: requestAddress },
                    }),
                );
                toast.success("Balance updated successfully.");
            }
        } catch (err) {
            // 网络抖动等临时错误不应中断轮询，仅打印警告
            console.warn(`[${walletName}] refreshBalance failed:`, err);
        }
    };

    // 包装 signer.sendTransaction：等待交易回执确认后自动刷新余额(监听原生及ERC20交易 转账消耗 gas)
    const origSend = signer.sendTransaction.bind(signer) as typeof signer.sendTransaction;
    signer.sendTransaction = async (tx: ethers.TransactionRequest) => {
        const res = await origSend(tx);
        await res.wait().then(() => {
            if (!disposed) {
                refreshBalance();
            }
        });
        return res;
    }

    // 启动定时轮询（已在轮询时调用无副作用）
    const startPolling = () => {
        if (pollTimer !== null) return;
        // pollTimer = window.setInterval(refreshBalance, POLL_INTERVAL_MS);
    };

    // 停止定时轮询
    const stopPolling = () => {
        if (pollTimer === null) return;
        window.clearInterval(pollTimer);
        pollTimer = null;
    };

    /**
     * 页面可见性变化处理：
     * - 页面进入后台（hidden）时停止轮询，节省 RPC 请求
     * - 页面重新可见时立即刷新一次余额，并恢复轮询
     */
    const onVisibilityChange = () => {
        if (document.hidden) {
            stopPolling();
        } else {
            refreshBalance();
            startPolling();
        }
    };

    /**
     * 账户切换事件处理（用户在钱包扩展里切换账户）
     * - 新账户列表为空 → 视为断开
     * - 否则派发 connected 事件并刷新余额
     */
    const handleAccountsChanged = async (newAccounts: string[]) => {
        if (!newAccounts || newAccounts.length === 0) {
            // 账户列表清空，视为用户在扩展内断开了连接
            window.dispatchEvent(new CustomEvent(WALLET_EVENTS.disconnected));
            return;
        }
        //从新账号获取最新地址
        const nextAddress = newAccounts[0];

        if (nextAddress.toLowerCase() === currentAddress.toLowerCase()) {
            //地址相等 不再处理下面流程(toLowerCase 不加括号就是类型判断  也是走相等的)
            return;
        }

        //重新调整及签名
        currentAddress = nextAddress;
        signer = await provider.getSigner(currentAddress);

        //强制切换账号 余额查询派发事件
        lastBalance = -1n;

        window.dispatchEvent(
            new CustomEvent(WALLET_EVENTS.connected, {
                detail: { account: newAccounts },
            }),
        );
        // 账户切换后余额归属变了，立即刷新
        refreshBalance();
    };

    //声明需要返回的结果(确保链路类型切换后  provider为最新provider okx)
    const connectionResult = {
        accounts,
        signer,
        address: currentAddress,
        chainId,
        provider,
        rawProvider,
        balance: initialBalance,
        refreshBalance,
    } as ConnectionResult;
    /**
     * 链切换事件处理（用户在钱包扩展里切换网络）
     * - 重建 provider：切链后旧 provider 绑定的是旧网络的 RPC，必须用新网络重建
     * - 将 lastBalance 重置为 -1n，确保下次 refreshBalance 一定会派发 balanceChanged
     */
    const handleChainChanged = (newChainIdHex: string) => {
        console.log(`[${walletName}] handleChainChanged: ${newChainIdHex}`);
        const newChainId = parseChainId(newChainIdHex);
        lastBalance = -1n;
        //只有非 OKX 钱包才重建 provider
        if (!isOkxWallet) {
            provider = new ethers.BrowserProvider(rawProvider);
            //改变provider 需要重新赋值 不然网络切换拿的 provider不对
            connectionResult.provider = provider;
        }
        // 切链后旧 provider 绑定的是旧网络，必须重建
        //provider = new ethers.BrowserProvider(rawProvider);
        // 重置基线，下一次拉取一定会派发余额事件
        lastBalance = -1n;
        window.dispatchEvent(
            new CustomEvent(WALLET_EVENTS.chainChanged, {
                detail: { chainId: newChainId },
            }),
        );
        // 用新 provider 立即刷新余额
        refreshBalance();
    };

    /**
     * 钱包主动断开事件（如扩展被禁用、用户撤销授权）
     */
    const handleDisconnect = () => {
        window.dispatchEvent(new CustomEvent(WALLET_EVENTS.disconnected));
    };

    // 注册 EIP-1193 事件监听
    rawProvider.on?.("accountsChanged", handleAccountsChanged);
    rawProvider.on?.("chainChanged", handleChainChanged);
    rawProvider.on?.("disconnect", handleDisconnect);

    // 监听页面可见性变化，控制轮询开关
    document.addEventListener("visibilitychange", onVisibilityChange);

    // 页面当前可见时立即启动轮询
    if (!document.hidden) startPolling();

    /**
     * 监听一笔交易上链，确认后自动刷新原生币余额。
     * 业务方发送 ERC-20 转账或合约调用后，传入 txHash 即可，
     * SDK 等待 transaction receipt 返回后自动触发 refreshBalance。
     */
    const watchTransaction = async (tx: string, confirmations?: number): Promise<ethers.TransactionReceipt | null> => {
        try {
            const receipt = await provider.waitForTransaction(tx, confirmations);
            if (receipt) {
                await refreshBalance();
            }
            return receipt;
        } catch (err) {
            console.error("watchTransaction failed:", err);
            return null;
        }
    }

    /**
     * 断开连接并清理所有副作用：
     * - 停止轮询计时器
     * - 移除页面可见性监听
     * - 移除钱包事件监听
     * - 移除 ethers provider 的所有监听器
     */
    const disconnect = async () => {
        disposed = true;
        stopPolling();
        document.removeEventListener("visibilitychange", onVisibilityChange);
        rawProvider.removeListener?.("accountsChanged", handleAccountsChanged);
        rawProvider.removeListener?.("chainChanged", handleChainChanged);
        rawProvider.removeListener?.("disconnect", handleDisconnect);
        provider.removeAllListeners();
    };

    // 发起转账交易（已通过包装 signer.sendTransaction 自动等待确认并刷新余额）
    const sendTransaction = async (tx: ethers.TransactionRequest) => {
        const transaction = await signer.sendTransaction(tx);
        console.log("交易发送成功:", transaction.hash);
        const receipt = await transaction.wait();
        console.log("交易上链成功:", receipt);
        return receipt;
    }

    // 返回连接结果
    connectionResult.disconnect = disconnect;
    connectionResult.sendTransaction = sendTransaction;
    connectionResult.watchTransaction = watchTransaction;

    return connectionResult;
}
