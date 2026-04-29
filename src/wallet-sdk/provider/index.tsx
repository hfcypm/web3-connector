import React, { createContext, useState, useEffect, useContext, useMemo } from "react";
import type { Wallet, WalletContextValue, WalletProviderProps, WalletState } from "../types";
import { WalletModal } from "../componets/WalletModal";
import { chainIDNameDict } from "../const/network";


const WalletContext = createContext<WalletContextValue>({
    connect: async () => { },
    disconnect: async () => { },
    isConnecting: false,
    isConnected: false,
    address: '',
    chaindID: 0,
    swichChain: async () => { },
    openModal: function (): void { },
    closeModal: function (): void { },
    ensName: null,
    error: null,
    chains: [],
    provider: undefined,
    netName: '',
    balance: ''
});


export const WalletProvider: React.FC<WalletProviderProps> = ({ children, chains, provider, autoConnect, wallets }) => {
    const [state, setState] = useState<WalletState>({
        address: '',
        chaindID: 0,
        netName: '',
        isConnecting: false,
        isConnected: false,
        ensName: null,
        error: null,
        chains,
        provider,
        balance: ''
    });
    //弹窗打开及关闭的状态
    const [modalOpen, setModalOpen] = useState(false);
    //缓存用户连接的钱包的字典(使用memo 把数组转换为字典存储)
    const wallletDict = useMemo(() => {
        return wallets.reduce((acc, wallet) => {
            acc[wallet.id] = wallet;
            return acc;
        }, {} as Record<string, Wallet>);
    }, [wallets]);

    const connect = async (walletId: string) => {
        //触发用户在列表选择的钱包类型回调
        const wallet = wallletDict[walletId] || {};
        if (!wallet) {
            throw new Error(`wallet not found! walletId: ${walletId}`)
        }
        setState(prevState => ({
            ...prevState,
            isConnecting: true,
        }));
        await wallet.connector().then((res) => {
            const { accounts, singer, chainId, address, balance } = res;
            //打印钱包实际回传的参数对象
            console.log('---------------打印钱包实际回传的参数对象------start----------');
            console.log('accounts', accounts);
            console.log('singer', singer);
            console.log('chainId', chainId);
            console.log('address', address);
            console.log('balance', balance);
            console.log('---------------打印钱包实际回传的参数对象------end----------');
            //根据返回来chainID获取网络名称
            const netID = Number(chainId);
            const netName = chainIDNameDict[netID] || 'Unknown Network';
            //用户实际发送连接请求指定钱包功能
            setState(prevState => ({
                ...prevState,
                address: address,
                chaindID: chainId,
                isConnected: true,
                isConnecting: false,
                netName: netName,
                balance: balance,
            }));
        }).catch(error => {
            //连接失败 返回错误信息
            setState(prevState => ({
                ...prevState,
                isConnecting: false,
                error: error as Error,
            }));
        });
    };

    const disconnect = async () => {
        setState(prevState => ({
            ...prevState,
            address: '',
            chaindID: 0,
            isConnected: false,
            netName: '',
        }));
    };

    const swichChain = async () => {

    };

    const openModal = () => {
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
    };

    const value: WalletContextValue = {
        ...state,
        connect,
        disconnect,
        swichChain,
        openModal,
        closeModal,
    };

    useEffect(() => {
        if (autoConnect) {
            //value.connect();
        }
    }, []);

    return (
        <WalletContext.Provider value={value}>
            {children}
            <WalletModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                wallets={wallets}
                onSelectWallet={(wallet) => {
                    //触发用户在列表选择的钱包类型回调
                    connect(wallet.id)
                }}
                connecting={state.isConnecting}
                error={state.error}
            />
        </WalletContext.Provider>
    );
}


//导出钱包上下文Hook、用于在组件中获取钱包上下文值
export const useWallet = (): WalletContextValue => {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
}

//外层包裹组件、用于提供钱包上下文
export default WalletProvider