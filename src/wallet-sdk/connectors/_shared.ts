import { ethers } from "ethers";

export const WALLET_EVENTS = {
    connected: "wallet-connected",
    disconnected: "wallet-disconnected",
    chainChanged: "wallet-chain-changed",
    balanceChanged: "wallet-balance-changed",
} as const;

const POLL_INTERVAL_MS = 15_000;

export interface ConnectionResult {
    accounts: string[];
    signer: ethers.JsonRpcSigner;
    address: string;
    chainId: bigint;
    provider: ethers.BrowserProvider;
    balance: bigint;
    refreshBalance: () => Promise<void>;
    disconnect: () => Promise<void>;
}

export async function setupWalletConnection(
    rawProvider: any,
    walletName: string,
): Promise<ConnectionResult> {
    let provider = new ethers.BrowserProvider(rawProvider);
    const accounts: string[] = await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const initialBalance = await provider.getBalance(address);
    const { chainId } = await provider.getNetwork();

    let lastBalance: bigint = initialBalance;
    let pollTimer: number | null = null;
    let disposed = false;

    const refreshBalance = async () => {
        if (disposed) return;
        try {
            const next = await provider.getBalance(address);
            if (next !== lastBalance) {
                lastBalance = next;
                window.dispatchEvent(
                    new CustomEvent(WALLET_EVENTS.balanceChanged, {
                        detail: { balance: next },
                    }),
                );
            }
        } catch (err) {
            console.warn(`[${walletName}] refreshBalance failed:`, err);
        }
    };

    const startPolling = () => {
        if (pollTimer !== null) return;
        pollTimer = window.setInterval(refreshBalance, POLL_INTERVAL_MS);
    };
    const stopPolling = () => {
        if (pollTimer === null) return;
        window.clearInterval(pollTimer);
        pollTimer = null;
    };
    const onVisibilityChange = () => {
        if (document.hidden) {
            stopPolling();
        } else {
            refreshBalance();
            startPolling();
        }
    };

    const handleAccountsChanged = (newAccounts: string[]) => {
        if (!newAccounts || newAccounts.length === 0) {
            window.dispatchEvent(new CustomEvent(WALLET_EVENTS.disconnected));
            return;
        }
        window.dispatchEvent(
            new CustomEvent(WALLET_EVENTS.connected, {
                detail: { account: newAccounts },
            }),
        );
        refreshBalance();
    };

    const handleChainChanged = (newChainIdHex: string) => {
        const newChainId = Number.parseInt(newChainIdHex, 16);
        // 切链后旧 provider 绑定的是旧网络，必须重建
        provider = new ethers.BrowserProvider(rawProvider);
        // 重置基线，下一次拉取一定会派发余额事件
        lastBalance = -1n;
        window.dispatchEvent(
            new CustomEvent(WALLET_EVENTS.chainChanged, {
                detail: { chainId: newChainId },
            }),
        );
        refreshBalance();
    };

    const handleDisconnect = () => {
        window.dispatchEvent(new CustomEvent(WALLET_EVENTS.disconnected));
    };

    rawProvider.on?.("accountsChanged", handleAccountsChanged);
    rawProvider.on?.("chainChanged", handleChainChanged);
    rawProvider.on?.("disconnect", handleDisconnect);
    document.addEventListener("visibilitychange", onVisibilityChange);

    if (!document.hidden) startPolling();

    const disconnect = async () => {
        disposed = true;
        stopPolling();
        document.removeEventListener("visibilitychange", onVisibilityChange);
        rawProvider.removeListener?.("accountsChanged", handleAccountsChanged);
        rawProvider.removeListener?.("chainChanged", handleChainChanged);
        rawProvider.removeListener?.("disconnect", handleDisconnect);
        provider.removeAllListeners();
    };

    return {
        accounts,
        signer,
        address,
        chainId,
        provider,
        balance: initialBalance,
        refreshBalance,
        disconnect,
    };
}
