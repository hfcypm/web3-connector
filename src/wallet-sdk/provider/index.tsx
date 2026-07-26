import React, { useState, useEffect, useContext, useMemo, useRef, useCallback } from "react";
import type { Wallet, WalletContextValue, WalletProviderProps, WalletState } from "../types";
import { WalletModal } from "../componets/WalletModal";
import { chainIDNameDict } from "../const/network";
import { WALLET_EVENTS, type ConnectionResult } from "../connectors/_sharedwallet";
import { WalletContext } from "./WalletContext";
import { getStorageItem, setStorageItem } from "../utils/index"


/**
 * 钱包全局 provider
 */
export const WalletProvider: React.FC<WalletProviderProps> = ({ children, chains, provider, autoConnect, wallets }) => {
    const [state, setState] = useState<WalletState>({
        address: '',
        currentConnectwalletID: '',
        currentConnectwalletName: '',
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
    const [modalOpen, setModalOpen] = useState(false);

    // 用 ref 持有当前连接器，避免重连时旧监听泄漏，并让全局事件处理器读到最新值
    const connectorRef = useRef<ConnectionResult | null>(null);

    // 钱包字典 - 用于快速查找钱包
    // 把钱包列表转换为字典形式
    const wallletDict = useMemo(() => {
        return wallets.reduce((acc, wallet) => {
            acc[wallet.id] = wallet;
            return acc;
        }, {} as Record<string, Wallet>);
    }, [wallets]);

    const closeModal = useCallback(() => setModalOpen(false), []);
    const openModal = useCallback(() => setModalOpen(true), []);

    // 业务-立即刷新
    const refreshBalance = useCallback(async () => {
        await connectorRef.current?.refreshBalance();
    }, []);

    // 业务-发送交易转账
    const sendTransaction = useCallback(async (transaction: any) => {
        if (!connectorRef.current) return null;
        return await connectorRef.current.sendTransaction(transaction);
    }, []);

    // 链上交易监听事件
    const watchTransaction = useCallback(async (tx: string, confirmations: number) => {
        if (!connectorRef.current) return null;
        return await connectorRef.current.watchTransaction(tx, confirmations);
    }, []);

    // 断开
    const disconnect = useCallback(async () => {
        if (connectorRef.current?.disconnect) {
            await connectorRef.current.disconnect();
        }
        connectorRef.current = null;
        setState(prev => ({
            ...prev,
            address: '',
            chaindID: 0,
            isConnected: false,
            netName: '',
            balance: '',
            currentConnectwalletID: '',
            provider: undefined,
        }));
        localStorage.removeItem('lastConnectedWallet')
    }, []);

    // 连接钱包
    const connect = useCallback(async (walletId: string) => {
        const wallet = wallletDict[walletId];
        if (!wallet) {
            throw new Error(`wallet not found! walletId: ${walletId}`);
        }

        // 切换钱包前先清理旧连接，避免事件监听叠加
        if (connectorRef.current?.disconnect) {
            await connectorRef.current.disconnect();
            connectorRef.current = null;
        }

        setState(prev => ({
            ...prev,
            isConnecting: true,
            currentConnectwalletID: walletId,
            currentConnectwalletName: wallet.name,
            error: null,
        }));

        //存储钱包的ID 以便于下次更好的连接 有效时长为12h
        setStorageItem('lastConnectedWallet', walletId, 12)

        try {
            const result = await wallet.connector();
            connectorRef.current = result;
            const { chainId, address, balance, provider: walletProvider } = result;
            const netID = Number(chainId);
            const netName = chainIDNameDict[netID] || 'Unknown Network';

            setState(prev => ({
                ...prev,
                address,
                chaindID: netID,
                isConnected: true,
                isConnecting: false,
                netName,
                balance: balance.toString(),
                provider: walletProvider,
            }));
            closeModal();
        } catch (error) {
            setState(prev => ({
                ...prev,
                isConnecting: false,
                error: error as Error,
            }));
            closeModal();
        }
    }, [wallletDict, closeModal]);

    // 自定义的UI中 网络下拉切换的处理
    const switchChain = useCallback(async (selectChainID: number) => {
        try {
            //触发UI层切换网络链事件 执行网络切换
            //重置当前钱包的错误状态
            setState(prev => ({ ...prev, error: null }))
            //检查支持的链路中是否包含当前选择ID
            const findChain = chains.find((chain) => chain.id === selectChainID)
            if (!findChain) {
                //如果没有找到
                throw new Error(`当前列表不支持的的网络:ID${selectChainID}`);
            }

            // 避免多钱包共存时链切换请求发送到错误的钱包(使用传入的)
            const rawProvider = connectorRef.current?.rawProvider
            if (!rawProvider) {
                throw new Error('没有可以连接的钱包！');
            }
            //网络切换链接
            //https://docs.metamask.io/metamask-connect/evm/reference/json-rpc-api/wallet_switchEthereumChain/
            try {
                //发起切换指定激活的网络
                await rawProvider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [
                        { chainId: `0x${selectChainID.toString(16)}` }
                    ]
                })
            } catch (error: any) {
                if (error.code === 4092) {
                    //当前要切换的链，还没添加到用户钱包里
                    //把当前链路加至钱包中
                    //https://docs.metamask.io/metamask-connect/evm/reference/json-rpc-api/wallet_addEthereumChain/
                    rawProvider.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: `0x${selectChainID.toString(16)}`,
                                chainName: findChain.name,
                                rpcUrls: [findChain.rpc],
                                nativeCurrency: findChain.currency,
                                blockExplorerUrls: findChain.blockExplorer
                                    ? [findChain.blockExplorer.url]
                                    : undefined,
                            }
                        ]
                    })
                } else {
                    throw error
                }
            }
        } catch (error) {
            console.error('Error switching chain:', error);
            setState(prev => ({ ...prev, error: error as Error }));
        }
    }, []);

    // 全局事件监听：connector 派发出来的事件 -> 更新 React state
    useEffect(() => {
        const handleChainChanged = (event: Event) => {
            const { chainId } = (event as CustomEvent).detail;
            const netID = Number(chainId);
            const netName = chainIDNameDict[netID] || 'Unknown Network';
            setState(prev => ({
                ...prev,
                chaindID: netID,
                netName,
            }));
            // 余额刷新由 connector 在 chainChanged 内部触发，这里无需重复请求
        };

        const handleWalletConnected = (event: Event) => {
            const { account } = (event as CustomEvent).detail;
            if (account?.length > 0) {
                setState(prev => ({
                    ...prev,
                    address: account[0],
                    isConnected: true,
                }));
            }
        };

        const handleWalletDisconnected = () => {
            // 钱包侧主动断开（用户在扩展里点了断开），同步清理本地状态
            connectorRef.current = null;
            setState(prev => ({
                ...prev,
                address: '',
                chaindID: 0,
                isConnected: false,
                netName: '',
                balance: '',
                currentConnectwalletID: '',
                provider: undefined,
            }));
        };

        const handleBalanceChanged = (event: Event) => {
            //账户快速切换时，旧请求可能覆盖当前账户 UI
            //监听余额事件时读取事件中的地址
            const { balance, address } = (event as CustomEvent).detail;
            setState((prev) => {
                // 余额属于旧账户时，保持当前页面状态
                if (address.toLowerCase() !== prev.address?.toLowerCase()) {
                    return prev;
                }
                return {
                    ...prev,
                    balance: typeof balance === 'bigint' ? balance.toString() : String(balance),
                }
            });
        };

        window.addEventListener(WALLET_EVENTS.chainChanged, handleChainChanged);
        window.addEventListener(WALLET_EVENTS.connected, handleWalletConnected);
        window.addEventListener(WALLET_EVENTS.disconnected, handleWalletDisconnected);
        window.addEventListener(WALLET_EVENTS.balanceChanged, handleBalanceChanged);
        return () => {
            window.removeEventListener(WALLET_EVENTS.chainChanged, handleChainChanged);
            window.removeEventListener(WALLET_EVENTS.connected, handleWalletConnected);
            window.removeEventListener(WALLET_EVENTS.disconnected, handleWalletDisconnected);
            window.removeEventListener(WALLET_EVENTS.balanceChanged, handleBalanceChanged);
        };
    }, []);

    //挂载的时候 根据钱包根据外部传来的状态 自动进行挂载
    useEffect(() => {
        if (autoConnect) {
            const lastConnectedWalletId = getStorageItem<string>('lastConnectedWallet');
            if (lastConnectedWalletId && wallletDict[lastConnectedWalletId]) {
                connect(lastConnectedWalletId)
            }
        }
    }, [autoConnect, wallletDict]);

    // 组件卸载时清理 connector（页面跳转/热更新场景）
    useEffect(() => {
        return () => {
            connectorRef.current?.disconnect?.();
            connectorRef.current = null;
        };
    }, []);

    const value: WalletContextValue = {
        ...state,
        connect,
        disconnect,
        switchChain,
        openModal,
        refreshBalance,
        sendTransaction,
        watchTransaction,
    };

    return (
        <WalletContext.Provider value={value}>
            {children}
            <WalletModal
                isOpen={modalOpen}
                onClose={closeModal}
                wallets={wallets}
                onSelectWallet={(wallet) => { connect(wallet.id); }}
                connecting={state.isConnecting}
                error={state.error}
                connectionWalletID={state.currentConnectwalletID}
            />
        </WalletContext.Provider>
    );
}


export const useWallet = (): WalletContextValue => {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
}

export default WalletProvider
