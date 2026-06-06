import { toast } from "react-toastify";
import { useWallet } from "../provider";
import { ethers } from 'ethers';
import { useState } from "react";

export default function TransferButton() {
    // 输入状态
    const [address, setAddress] = useState<string>('');
    const [money, setMoney] = useState<string>('');
    //导入hook
    const { sendTransaction, isConnected } = useWallet();
    // 发起转账
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

            {/* 添加测试转账按钮 */}
            <button className="bg-red-400 text-white font-bold py-1 px-2 rounded hover:bg-red-600 mt-2"
                onClick={() => { testTransfer() }}>发起转账</button>
            <div className="flex flex-col items-start">
                <div>address:{address}</div>
                <div>money:{money}</div>
            </div>
        </div>
    );
}