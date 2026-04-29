import { useState } from 'react'
import { useWallet } from '../provider'
import { Globe, Power } from 'lucide-react';

//自定义当前连接属性
interface ConnectionButtonProps {
    label?: string;
    showBanlance?: boolean;
    size?: "sm" | "md" | "lg";
    className?: string;
    //hook 事件
    onConnection?: () => void;
    onDisConnection?: () => void;
    onChainChange?: () => void;
    onBalanceChange?: (balance: string) => void;
    onError?: (error: Error) => void;
}

export default function ConnectionButton({
    label = 'connect wallet',
    showBanlance = false,
    size = 'md',
    className = '',
}: ConnectionButtonProps) {
    //自定义的钱包一些配置
    const { disconnect, isConnected, address
        , chaindID, ensName, error, openModal, closeModal, netName } = useWallet();
    const [balance, setBanlance] = useState<string | null>('');
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
    if (isConnected) {
        //已连接状态断开钱包链接
        return (
            <>
                <div className='flex flex-col'>
                    <div className='flex h-10 mb-5 flex-row justify-items-center items-center'>
                        {/* 地址 */}
                        <div className='flex h-10 items-center justify-center border border-gray-300 rounded-lg p-2'>
                            <Globe className='w-6 h-6 text-gray-500'></Globe>
                            <div className='ml-2'>{netName}</div>
                        </div>

                        <div className='flex flex-row h-10 justify-center items-center ml-4 px-2 border border-gray-300 rounded-md'>
                            {/* 显示前5个字符  超出显示省略号 */}
                            <div className='ml-2 w-[5ch] overflow-hidden text-ellipsis whitespace-nowrap'>{address}</div>
                            {/* 余额 */}
                            <div className='ml-2'>{balance}</div>
                            <Power className='w-5 h-5 text-gray-500 hover:text-gray-700 cursor-pointer' onClick={handleDisconnect}></Power>
                        </div>
                    </div>
                </div>
            </>
        );

    } else {
        return (
            <button className={`bg-blue-400 text-white font-bold py-2 px-4 rounded hover:bg-blue-500 ${className} ${sizeClass[size]}`}
                onClick={openModal}>{label}</button>
        );
    }
}