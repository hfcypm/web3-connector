import { useWallet } from '../provider'
import { Globe, Power, ChevronDown } from 'lucide-react';
import { ethers, formatEther } from 'ethers';
import React, { useState, useCallback, type FC, useMemo, useEffect } from 'react';
import { twMerge } from 'tailwind-merge'
import type { Chain } from '../types';


//自定义当前连接属性
interface ConnectionButtonProps {
    label?: string;
    showBanlance?: boolean;
    size?: "sm" | "md" | "lg";
    className?: string;
    showWalletName?: boolean;
    //hook 事件
    onConnection?: () => void;
    onDisConnection?: () => void;
    onChainChange?: (fromChainId: number, toChainId: number) => void;
    onBalanceChange?: (balance: string) => void;
    onError?: (error: Error) => void;
}

const ConnectionButton: React.FC<ConnectionButtonProps> & { Custom: React.FC<ConnectButtonCustomProps> } = ({
    label = 'connect wallet',
    showBanlance = true,//默认展示余额
    size = 'md',
    className = '',
    showWalletName = false,
    onChainChange
}) => {
    //是否展示网络切换下拉菜单
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

    //自定义的钱包一些配置
    const { disconnect, isConnected, address, openModal
        , netName, balance, currentConnectwalletName
        , chaindID, switchChain, chains } = useWallet();

    const sizeClass = {
        sm: 'text-sm px-3 py-1.5',
        md: 'text-md px-4 py-2',
        lg: 'text-lg px-5 py-2.5',
    }

    const handleDisconnect = async () => {
        try {
            await disconnect();
        } catch (error) {
            console.log('fail to disconnect wallet', error);
        }
    }
    //换算成 ETH（Sepolia ETH）
    const balanceEth = formatEther(balance || '0');
    //保留4位小数
    const balanceFixed = parseFloat(balanceEth).toFixed(4);

    /** ---------change network start--------- */
    //支持网络的的下拉三角箭头
    const handleDropEvent = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsDropdownOpen((preDropdownOpen) => !preDropdownOpen)
    }
    //网络切换处理(用户点击列表条目)
    const handleChainChange = useCallback(async (selectChainId: number) => {
        try {
            if (selectChainId !== chaindID) {
                //执行网络切换动作
                await switchChain(selectChainId)
                //回调到UI层callback
                // 触发链切换回调
                if (selectChainId && onChainChange) {
                    onChainChange(chaindID, selectChainId);
                }
            }
        } catch (error) {
            console.log('fail to change network', error);
        }
        setIsDropdownOpen(false)
    }, [chaindID, switchChain, onChainChange])
    /** ---------change network end--------- */

    if (isConnected) {
        //已连接状态断开钱包链接
        return (
            <>
                <div className='flex flex-col'>
                    <div className='flex h-10 mb-5 flex-row justify-items-center items-center'>

                        {/* 钱包名称 */}
                        {showWalletName ? <div className='flex h-10 items-center justify-center border border-gray-300
                         rounded-lg p-2 hover:bg-gray-400 mr-2'>{currentConnectwalletName}</div> : null}

                        {/* 地址 */}
                        <div className='relative'>
                            <div className='flex h-10 w-40 items-center justify-center border border-gray-300 rounded-lg p-2'>
                                <Globe className='w-6 h-6 text-gray-500'></Globe>
                                <div className='ml-2'>{netName}</div>
                                <ChevronDown
                                    className={`ml-2 text-gray-500 dark:text-gray-400 transform transition-transform duration-300 shrink-0 ${isDropdownOpen ? 'rotate-180' : ''
                                        }`}
                                    onClick={(e) => handleDropEvent(e)} />
                            </div>
                            {/* 点击展开列表数据 1.下面遮罩层 2.列表数据渲染 */}
                            {
                                isDropdownOpen && (
                                    <>
                                        {/* 遮罩层 */}
                                        <div className='fixed z-40 inset-0' onClick={() => setIsDropdownOpen(false)} />

                                        <div className="absolute top-full mt-2 w-48 
                                            bg-white dark:bg-gray-800 
                                            rounded-sm shadow-sm
                                            border  border-gray-200 dark:border-gray-600
                                            backdrop-blur-lg
                                            z-50 overflow-hidden">{
                                                chains.map((chain) =>
                                                    <button onClick={() => handleChainChange(chain.id)}
                                                        className={`w-full h-10 text-center  hover:bg-gray-100 
                                                            ${chain.id === chaindID
                                                                ? 'font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-300 dark:text-blue-300'
                                                                : 'text-gray-700 dark:text-gray-200'
                                                            }`}
                                                    >
                                                        <div className='flex items-center justify-center'>
                                                            <span>{chain.name.split(' ')[0]}</span>
                                                            {chain.id === chaindID && <div className="w-2.5 h-2.5 ml-2 bg-blue-300 rounded-full shadow-lg" />}
                                                        </div>
                                                    </button>
                                                )
                                            }
                                        </div>
                                    </>
                                )
                            }
                        </div>

                        <div className='flex flex-row h-10 justify-center items-center ml-4 px-2 border border-gray-300 rounded-md'>
                            {/* 显示前5个字符  超出显示省略号 显示前 5位：w-[5ch] */}
                            <div className='ml-2 w-[5ch] overflow-hidden text-ellipsis whitespace-nowrap'>{address}</div>
                            {/* 余额 */}
                            {showBanlance ? <div className='px-2'>{balanceFixed} ETH</div> : null}

                            <Power className='w-5 h-5 text-gray-500 hover:text-gray-700 cursor-pointer' onClick={handleDisconnect}></Power>
                        </div>
                    </div>
                </div>
            </>
        );

    } else {
        // 未连接状态 连接钱包
        return (
            <button className={
                twMerge("bg-blue-400 text-white font-bold py-2 px-4 rounded hover:bg-blue-500 "
                    , sizeClass[size]
                    , className
                )}
                onClick={openModal}>{label}</button>
        );
    }
}

//子组件

//1.渲染属性
export interface ConnectButtonRenderProps {
    isConnected: boolean;
    isConnecting: boolean;
    address: string | null;
    ensName: string | null;
    balance: string | null;
    chainId: number | null;
    currentChain: Chain | null;
    chains: Chain[];
    connect: () => void;
    disconnect: () => void;
    switchChain: (chainId: number) => Promise<void>;
    isDropdownOpen: boolean;
    setIsDropdownOpen: (open: boolean) => void;
    error: Error | null;

}
//2.ConnectButtonCustomProps 触发调用传递属性
export interface ConnectButtonCustomProps {
    children: (props: ConnectButtonRenderProps) => React.ReactNode;
    className?: string;
}

//3.自定义custom所处理东西
const ConnectButtonCustom: React.FC<ConnectButtonCustomProps> = ({ children, className = '' }) => {
    const useWalletContext = useWallet();
    const [balance, setBalance] = useState<string | null>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)

    // 获取当前链信息
    const currentChain = useMemo(() => {
        return useWalletContext.chains.find((chain) => useWalletContext.chaindID === chain.id) || null
    }, [useWalletContext.chains, useWalletContext.chaindID]);

    //余额获取
    useEffect(() => {
        const fetchBalance = async () => {
            if (useWalletContext.address && useWalletContext.isConnected && useWalletContext.provider) {
                try {
                    const balanceWeiValue = await useWalletContext.provider.getBalance(useWalletContext.address)
                    const balanceValue = ethers.formatEther(balanceWeiValue)
                    setBalance(balanceValue)
                } catch (error) {
                    console.log('get balance error:', error)
                }
            } else {
                setBalance(null)
            }
        }

        fetchBalance()
    }, [useWalletContext.address, useWalletContext.isConnected, useWalletContext.provider])


    //构造渲染属性
    const renderProps: ConnectButtonRenderProps = {
        // 连接状态
        isConnected: useWalletContext.isConnected,
        isConnecting: useWalletContext.isConnecting,
        // 账户信息
        address: useWalletContext.address,
        ensName: useWalletContext.ensName,
        balance,
        // 网络信息
        chainId: useWalletContext.chaindID,
        currentChain,
        chains: useWalletContext.chains,
        // 操作方法
        connect: useWalletContext.openModal,
        disconnect: useWalletContext.disconnect,
        switchChain: useWalletContext.switchChain,
        // UI状态
        isDropdownOpen,
        setIsDropdownOpen,
        // 错误状态
        error: useWalletContext.error,
    }

    return (
        <div className={className}>
            {children(renderProps)}
        </div>
    )
}

//把当前自定义组加件当作静态组件加入进去
ConnectionButton.Custom = ConnectButtonCustom

export default ConnectionButton