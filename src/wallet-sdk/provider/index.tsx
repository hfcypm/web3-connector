import React, { createContext, useState, useEffect, useContext, useMemo } from "react";
import type { Wallet, WalletContextValue, WalletProviderProps, WalletState } from "../types";
import { WalletModal } from "../componets/WalletModal";
import { chainIDNameDict } from "../const/network";


const WalletContext = createContext<WalletContextValue>({
    connect: async () => { },
    disconnect: async () => { },
    isConnecting: false,
    isConnected: false,
    currentConnectwalletID: '',
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
        currentConnectwalletID: '',
        netName: '',
        isConnecting: false,
        isConnected: false,
        ensName: null,
        error: null,
        chains,
        provider,
        balance: '',
        chaindID: 0,
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

    // 处理网络切换事件
    const handleChainChanged = (event: Event) => {
        console.log('wallet 网络变化，收到事件：', 'wallet_chain_changed');
        const customEvent = event as CustomEvent;
        const { chainId } = customEvent.detail;
        const netID = Number(chainId);
        const netName = chainIDNameDict[netID] || 'Unknown Network';
        
        // 更新网络信息
        setState(prevState => ({
            ...prevState,
            chaindID: chainId,
            netName: netName,
        }));
        
        // 如果已连接钱包，刷新余额（因为不同网络的余额不同）
        if (state.isConnected && state.address && state.provider) {
            state.provider.getBalance(state.address).then((newBalance: any) => {
                setState(prevState => ({
                    ...prevState,
                    balance: newBalance.toString(),
                }));
            }).catch((error: any) => {
                console.error('Failed to refresh balance after chain change:', error);
            });
        }
        
        console.log('Network switched to:', netName, 'Chain ID:', chainId);
    };

    // 处理账户连接事件
    const handleWalletConnected = (event: Event) => {
        const customEvent = event as CustomEvent;
        const { account } = customEvent.detail;
        if (account && account.length > 0) {
            const address = account[0];
            setState(prevState => ({
                ...prevState,
                address: address,
                isConnected: true,
            }));
        }
    };

    // 处理钱包断开连接事件
    const handleWalletDisconnected = () => {
        setState(prevState => ({
            ...prevState,
            address: '',
            chaindID: 0,
            isConnected: false,
            netName: '',
            balance: '',
        }));
    };

    const handleBalanceChanged = (event: Event) => {
        const customEvent = event as CustomEvent;
        const { balance } = customEvent.detail;
        setState(prevState => ({
            ...prevState,
            balance: balance as string,
        }));
    };
    const connect = async (walletId: string) => {
        console.log('开始连接钱包:>>>>', walletId);
        //触发用户在列表选择的钱包类型回调
        const wallet = wallletDict[walletId] || {};
        if (!wallet) {
            throw new Error(`wallet not found! walletId: ${walletId}`)
        }
        setState(prevState => ({
            ...prevState,
            isConnecting: true,
            currentConnectwalletID: walletId,
        }));
        wallet.connector().then((res) => {
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
            console.log('netID:>>>>', netID);
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
            closeModal();
        }).catch(error => {
            //连接失败 返回错误信息
            setState(prevState => ({
                ...prevState,
                isConnecting: false,
                error: error as Error,
            }));
            closeModal();
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

    // 添加全局事件监听器
    useEffect(() => {
        window.addEventListener('wallet_chain_changed', handleChainChanged);
        window.addEventListener('wallet-connected', handleWalletConnected);
        window.addEventListener('wallet-disconnected', handleWalletDisconnected);
        window.addEventListener('wallet-balance-changed',handleBalanceChanged);
        return () => {
            window.removeEventListener('wallet_chain_changed', handleChainChanged);
            window.removeEventListener('wallet-connected', handleWalletConnected);
            window.removeEventListener('wallet-disconnected', handleWalletDisconnected);
            window.removeEventListener('wallet-balance-changed',handleBalanceChanged);
        };
    }, [state.isConnected, state.address, state.provider]);

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
                connectionWalletID={state.currentConnectwalletID}
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