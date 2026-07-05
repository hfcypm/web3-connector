import { createContext } from "react";
import type { WalletContextValue } from "../types";

/**
 * 钱包上下文 - 存储钱包状态和操作函数
 */
export const WalletContext = createContext<WalletContextValue>({
    connect: async () => { },
    disconnect: async () => { },
    isConnecting: false,
    isConnected: false,
    currentConnectwalletID: '',
    currentConnectwalletName: '',
    address: '',
    chaindID: 0,
    switchChain: async () => { },
    openModal: function (): void { },
    // closeModal: function (): void { },
    refreshBalance: async () => { },
    ensName: null,
    error: null,
    chains: [],
    provider: undefined,
    netName: '',
    balance: '',
    sendTransaction: async () => { },
    watchTransaction: async () => { return null; },
});
