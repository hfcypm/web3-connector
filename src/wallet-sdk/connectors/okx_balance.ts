import { ethers } from "ethers";

const RPC_BY_CHAIN: Record<string, string> = {
    "0x1": "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY",
    "0x38": "https://bsc-dataseed.binance.org",
    "0x89": "https://polygon-rpc.com",
    "0xa": "https://mainnet.optimism.io",
    "0xa4b1": "https://arb1.arbitrum.io/rpc",
    "0x2105": "https://mainnet.base.org",
    //okx连接使用
    "0xaa36a7": "https://ethereum-sepolia-rpc.publicnode.com",
};

export async function getBalanceFast(rawProvider: any, address: string) {
    const chainIdHex: string = await rawProvider.request({
        method: "eth_chainId",
    });

    const rpcUrl = RPC_BY_CHAIN[chainIdHex];

    if (!rpcUrl) {
        throw new Error(`No RPC configured for chain ${chainIdHex}`);
    }

    const readProvider = new ethers.JsonRpcProvider(rpcUrl);
    return await readProvider.getBalance(address);
}