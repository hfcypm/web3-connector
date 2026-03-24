export const supportChainsConfigs = [{
    id: 1,
    name: "Ethereum Mainnet",
    rpc: "https://eth-mainnet.g.alchemy.com/v2/your-api-key",
    currency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
        icon: "https://etherscan.io/favicon.ico",
    },
}, {
    id: 11155111,
    name: "Sepolia Testnet",
    rpc: "https://eth-sepolia.g.alchemy.com/v2/your-api-key",
    currency: {
        name: "Sepolia Ether",
        symbol: "SEP",
        decimals: 18,
        icon: "https://sepolia.etherscan.io/favicon.ico",
    }
}];

//以上以配置需要与type.ts 中预先定义的chain内容字段保持一致 才可引用
// 支持的区块链络类型
// export type Chain = {
//     id: number;
//     name: string;
//     rpc: string;
//     currency: {
//         name: string;
//         symbol: string;
//         decimals: number;
//         icon: string;
//     }
// }