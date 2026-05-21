import type { Wallet } from "../types";
import { setupWalletConnection } from "./_shared";

function isCoinbaseWalletInstalled() {
    return (
        typeof window !== "undefined" &&
        typeof (window as any).coinbaseWalletExtension !== "undefined"
    );
}

export const coinbaseConnector = async () => {
    if (!isCoinbaseWalletInstalled()) {
        throw new Error("Coinbase wallet is not installed");
    }
    try {
        const rawProvider = (window as any).coinbaseWalletExtension;
        return await setupWalletConnection(rawProvider, "coinbase");
    } catch (error) {
        console.error("Failed to connect to Coinbase Wallet:", error);
        throw error;
    }
};

export const coinbaseWallet: Wallet = {
    id: "coinbase",
    name: "Coinbase",
    icon: new URL("../../assets/coinbase.svg", import.meta.url).href,
    connector: coinbaseConnector,
    description:
        "Coinbase Wallet is a secure, easy-to-use, and free app for accessing crypto on the Ethereum blockchain.",
    installed: isCoinbaseWalletInstalled(),
    downloadLink: "https://www.coinbase.com/",
};
