import React, { createContext, useState, useEffect, useContext, useMemo } from "react";
import type { Wallet, WalletContextValue, WalletProviderProps, WalletState } from "../types";
import { WalletModal } from "../componets/WalletModal";


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
    provider: undefined
});


export const WalletProvider: React.FC<WalletProviderProps>
    = ({ children, chains, provider, autoConnect, wallets }) => {

        const [state, setState] = useState<WalletState>({
            address: '',
            chaindID: 0,
            isConnecting: false,
            isConnected: false,
            ensName: null,
            error: null,
            chains,
            provider
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

        const value: WalletContextValue = {
            ...state,
            connect: async (walletId: string) => {
                //todo:触发用户在列表选择的钱包类型回调
                const wallet = wallletDict[walletId] || {};
                if (!wallet) {
                    throw new Error(`wallet not found! walletId: ${walletId}`)
                }
                setState({
                    ...state,
                    isConnecting: true,
                });
                await wallet.connector().then((res) => {
                    //todo:用户实际发送连接请求指定钱包功能

                }).catch(error => {
                    //连接失败 返回错误信息
                    setState({
                        ...state,
                        isConnecting: false,
                        error: error as Error,
                    });
                });
            },
            disconnect: async () => {

            },
            isConnecting: false,
            isConnected: false,
            address: '',
            chaindID: 0,
            swichChain: async () => {

            },
            openModal: function (): void {
                setModalOpen(true);
            },
            closeModal: function (): void {
                setModalOpen(false);
            },
            ensName: null,
            error: null,
            chains,
            provider
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
                        //todo:触发用户在列表选择的钱包类型回调
                        value.connect(wallet.id)
                    }}
                    connecting={false}
                    error={null}
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


