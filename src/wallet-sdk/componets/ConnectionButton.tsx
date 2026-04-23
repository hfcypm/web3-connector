import { useState } from 'react'
import { useWallet } from '../provider'
import { injected } from 'wagmi';

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
    const { connect, disconnect, isConnected, address
        , chaindID, ensName, error, openModal, closeModal } = useWallet();
    const [balance, setBanlance] = useState<string | null>('');
    const sizeClass = {
        sm: 'text-sm px-3 py-1.5',
        md: 'text-md px-4 py-2',
        lg: 'text-lg px-5 py-2.5',
    }
    const handleConnect = async () => {
        try {
            await connect('wallet');
        } catch (error) {
            console.log('fail to connect wallet', error);
        }
    }
    const handleDisconnect = async () => {
        try {
            await disconnect();
        } catch (error) {
            console.log('fail to disconnect wallet', error);
        }
    }
    if (!isConnected) {
        return (
            <button className={`bg-blue-400 text-white font-bold py-2 px-4 rounded hover:bg-blue-500 ${className} ${sizeClass[size]}`}
                onClick={openModal}>{label}</button>
        );
    }
    //已连接状态   断开钱包链接
    return (
        <button className={`bg-red-400 text-white font-bold py-2 px-4 rounded hover:bg-red-500 ${className} ${sizeClass[size]}`}
            onClick={handleDisconnect}>disconnect wallet</button>
    );
}