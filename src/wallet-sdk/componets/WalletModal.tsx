import React from 'react'
import type { Wallet } from '../types';

interface WalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    wallets: Wallet[];
    onSelectWallet: (wallet: Wallet) => void;
    connecting: boolean;
    error: Error | null;
}
export const WalletModal = ({ isOpen, onClose, wallets, onSelectWallet, connecting, error }: WalletModalProps) => {
    if (!isOpen) {
        return null;
    }
    return (
        <>
            <div className='fixed inset-0 bg-[rgba(0,0,0,0.3)] flex items-center justify-center'
                onClick={onClose}>

                {/* 弹窗内容 */}
                <div className='bg-white w-100 p-8 rounded-2xl'>
                    <h2 className='text-2xl font-bold mb-4'>Select a Wallet</h2>
                    <div className='space-y-4 max-h-[60vh] overflow-y-auto pr-2'></div>
                    {/* 支持的钱包列表 */}
                    {
                        wallets.map((wallet) => (
                            <div key={wallet.id} className='flex items-center hover:bg-gray-100 py-3'
                                onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                                    //阻止外层默认事件(不然点击列表条目也关闭整个弹窗)
                                    e.stopPropagation();
                                    onSelectWallet(wallet);
                                }}>
                                <img src={wallet.icon} alt={wallet.name} className='w-10 h-10' />
                                <span className='ml-4 text-sm'>{wallet.name}</span>
                            </div>
                        ))
                    }
                </div>

            </div>

        </>
    )
}