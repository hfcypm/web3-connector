import type { Wallet } from "../types";
import { setupWalletConnection } from "./_shared";

function isPhantomWalletInstalled(): boolean {
    if (typeof window === "undefined") return false;
    const win = window as any;
    const ethereum = win.ethereum;
    const phantom = win.phantom?.ethereum;
    return !!phantom || (!!ethereum && ethereum.isPhantom === true);
}

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
