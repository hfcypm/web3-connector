import type { ethers } from "ethers";

//支持的区块链络类型
export type Chain = {
    id: number; // 链ID，十进制数字（1=ETH主网，56=BSC）
    name: string; // 网络名称：以太坊、BNB智能链等
    rpc: string; // RPC节点接口，用来发交易、查链上数据
    currency: { // 链原生代币配置（MetaMask必填）
        name: string;    // 代币全称
        symbol: string;  // 代币简称 ETH/BNB/MATIC
        decimals: number;// 小数位数，绝大多数公链18
        icon: string;    // 代币图标地址，前端展示用，钱包添加不使用
    }
    blockExplorer?: { // 可选 区块浏览器
        name: string; // 浏览器名称 Etherscan
        url: string;  // 浏览器地址 https://etherscan.io
    };
}

// 钱包的状态
export interface WalletState {
    //钱包地址
    address: string | null;
    //当前连接钱包ID
    currentConnectwalletID: string;
    //当前连接的钱包名称
    currentConnectwalletName: string;
    //是否正在连接
    isConnecting: boolean;
    // 是否连接
    isConnected: boolean;
    //余额余额
    balance: string | null;
    //ENS名称
    ensName: string | null;
    //错误
    error: Error | null;
    // 支持的切换网络列表
    //连接的链（支持的区块链络类型）
    chains: Chain[];
    //provider
    provider: any;
    //网络名称
    netName: string;
    //链路ID
    chaindID: number;
}

export interface WalletContextValue extends WalletState {
    connect: (walletID: string) => Promise<void>;
    disconnect: () => Promise<void>;
    switchChain: (chainID: number) => Promise<void>;
    openModal: () => void;
    //业务方可在交易确认后手动调用，立刻刷新余额
    refreshBalance: () => Promise<void>;
    //发送交易转账
    sendTransaction: (transaction: any) => Promise<any>;
    //监听一笔交易上链，确认后自动刷新原生币余额。
    watchTransaction: (tx: string, confirmations: number) => Promise<ethers.TransactionReceipt | null>;
}

export interface WalletProviderProps {
    children: React.ReactNode;
    chains: Chain[];
    wallets: Wallet[];
    autoConnect?: boolean;
    provider?: any;
}

export interface Wallet {
    id: string;
    name: string;
    icon: string;
    //钱包连接器
    connector: () => Promise<any>;
    //钱包描述
    description?: string;
    //是否安装
    installed?: boolean;
    downloadLink?: string;
}


