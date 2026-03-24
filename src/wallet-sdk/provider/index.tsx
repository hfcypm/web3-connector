import React, { createContext, useState, useEffect, useContext } from "react";
import type { WalletContextValue, WalletProviderProps, WalletState } from "../types";


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


export const WalletProvider: React.FC<WalletProviderProps> = ({ children, chains
    , provider, autoConnect }) => {

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

    const value: WalletContextValue = {
        ...state,
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


