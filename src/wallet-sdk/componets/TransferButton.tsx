import { toast } from "react-toastify";
import { useWallet } from "../provider";
import { ethers } from 'ethers';
import { useState } from "react";

export default function TransferButton() {
    // 输入状态
    const [address, setAddress] = useState<string>('');
    const [money, setMoney] = useState<string>('');
    // 交易等待状态
    const [pendingTx, setPendingTx] = useState<{ hash: string; loading: boolean }>({ hash: '', loading: false });
    //导入hook
    const { sendTransaction, isConnected, watchTransaction, provider } = useWallet();

    // 发起转账（一体式：发送 + 等待 + 刷新余额）
    const testTransfer = async () => {
        if (!isConnected) {
            toast.warning('请先连接钱包');
            return;
        }
        if (!address) {
            toast.warning('请输入转账地址');
            return;
        }
        if (!money) {
            toast.warning('请输入转账金额');
            return;
        }
        const trans = {
            to: address,
            value: ethers.parseEther(money),
        }
        await sendTransaction(trans);
        toast.success('转账成功');
        setMoney('');
        setAddress('');
    }

    //自己发交易 watchTransaction 监听上链（适用于 ERC-20 / 合约调用）
    const testTransferWithWatch = async () => {
        if (!isConnected) {
            toast.warning('请先连接钱包');
            return;
        }
        if (!address) {
            toast.warning('请输入转账地址');
            return;
        }
        if (!money) {
            toast.warning('请输入转账金额');
            return;
        }
        try {
            const trans = {
                to: address,
                value: ethers.parseEther(money),
            }
            // 1. 通过 signer 直接发送交易，只拿 hash，不等待
            const signer = provider.getSigner();
            const tx = await signer.sendTransaction(trans);
            setPendingTx({ hash: tx.hash, loading: true });
            toast.info(`交易已发送: ${tx.hash.slice(0, 10)}...`);

            // 2. 用 watchTransaction 监听上链，确认后自动刷新余额
            const receipt = await watchTransaction(tx.hash, 1);
            setPendingTx({ hash: '', loading: false });

            if (receipt) {
                toast.success('转账成功（watchTransaction 模式）');
            } else {
                toast.error('交易监听失败');
            }
            setMoney('');
            setAddress('');
        } catch (err: any) {
            setPendingTx({ hash: '', loading: false });
            toast.error(`转账失败: ${err?.message || err}`);
        }
    }

    if (!isConnected) {
        return null;
    }
    return (
        <div className='flex flex-col border border-gray-300 rounded-md p-2 w-full m-2'>

            <div>转账测试</div>
            <div className="flex items-center">
                <div>金额</div>
                <input placeholder="请输入转账金额" onChange={(e) => setMoney(e.currentTarget.value)}
                    className="w-40 py-1 ml-2  pl-1 border  border-gray-300 rounded-sm" />
            </div>
            <div className="flex items-center mt-2">
                <div>地址</div>
                <input placeholder="请输入转账地址" onChange={(e) => setAddress(e.currentTarget.value)}
                    className="w-40 py-1 ml-2 pl-1 border border-gray-300 rounded-sm" />
            </div>

            {/* 一体式转账：sendTransaction */}
            <button className="bg-red-400 text-white font-bold py-1 px-2 rounded hover:bg-red-600 mt-2"
                onClick={() => { testTransfer() }}>发起转账</button>

            {/* 分离式转账：signer.sendTransaction → watchTransaction */}
            <button
                className="bg-blue-400 text-white font-bold py-1 px-2 rounded hover:bg-blue-600 mt-2 disabled:opacity-50"
                disabled={pendingTx.loading}
                onClick={() => { testTransferWithWatch() }}>
                {pendingTx.loading ? `等待确认: ${pendingTx.hash.slice(0, 10)}...` : '发起转账 (watchTx)'}
            </button>

            <div className="flex flex-col items-start">
                <div>address:{address}</div>
                <div>money:{money}</div>
            </div>
        </div>
    );
}