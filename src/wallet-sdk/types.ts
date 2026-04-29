//支持的区块链络类型
export type Chain = {
    id: number;
    name: string;
    rpc: string;
    currency: {
        name: string;
        symbol: string;
        decimals: number;
        icon: string;
    }
}

// 钱包的状态
export interface WalletState {
    //钱包地址
    address: string | null;
    //钱包ID
    chaindID: number;
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
    //连接的链（支持的区块链络类型）
    chains: Chain[];
    //provider
    provider: any;
    //网络名称
    netName: string;
}

export interface WalletContextValue extends WalletState {
    connect: (walletID: string) => Promise<void>;
    disconnect: () => Promise<void>;
    swichChain: (chainID: string) => Promise<void>;
    openModal: () => void;
    closeModal: () => void;
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
    //下载链接
    downLoadLink?: string;
}


