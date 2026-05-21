import type { Wallet } from "../types";
import { setupWalletConnection } from "./_shared";

const connectMetamask = async () => {
    if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
    }
    try {
        return await setupWalletConnection(window.ethereum, "metamask");
    } catch (error) {
        console.error("Failed to connect to MetaMask:", error);
        throw error instanceof Error ? error : new Error("Failed to connect to MetaMask");
    }
};

export const metaMaskWallet: Wallet = {
    id: "metamask",
    name: "MetaMask",
    icon: new URL("../../assets/metamask.svg", import.meta.url).href,
    connector: connectMetamask,
    description:
        "MetaMask is a browser extension that allows you to connect to Ethereum-based blockchains.",
    installed: false,
    downloadLink: "https://metamask.io/",
};
