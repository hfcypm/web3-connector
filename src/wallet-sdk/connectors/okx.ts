import type { Wallet } from "../types";
import { setupWalletConnection } from "./_shared";

function isOkxWalletInstalled() {
    if (typeof window === "undefined") return false;
    const win = window as any;
    const ethereum = win.ethereum;
    const okxWallet = win.okxwallet;
    return !!okxWallet || (!!ethereum && ethereum.isOkxWallet === true);
}

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

export const okxWallet: Wallet = {
    id: "okx",
    name: "OKX Wallet",
    icon: new URL("../../assets/okx.png", import.meta.url).href,
    connector: okxConnector,
    description: "OKX Wallet is a wallet for the OKX network blockchain.",
    installed: isOkxWalletInstalled(),
    downloadLink: "https://www.okx.com/",
};
