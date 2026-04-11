import { ethers } from 'ethers'
import './App.css'
import WalletProvider from './wallet-sdk/provider'
import { supportChainsConfigs } from './wallet-sdk/chain'
import type { Wallet } from './wallet-sdk/types';

//钱包数组
const defWallets: Wallet[] = [];

function App() {
  //window.ethereum：是 MetaMask 等钱包注入的原始对象，属于底层 API。
  //ethers.BrowserProvider：是 ethers.js 库提供的包装类（Wrapper），它接收 window.ethereum 作为参数，然后创建出一个更高级的 provider 对象。
  //钱包-ethers  provider
  // window.ethereum  ──作为参数──>  new ethers.BrowserProvider()  ──返回──>  provider (ethers 实例)
  //     (底层原始对象)                        (ethers 包装器)                    (高级 provider)
  const provider = new ethers.BrowserProvider(window.ethereum)
  return (
    <>
      <WalletProvider
        chains={supportChainsConfigs}
        provider={provider}
        wallets={defWallets}
        autoConnect={true}>
        <h1 className='bg-red-400 h-20 flex items-center justify-center'>test
        </h1>
      </WalletProvider>
    </>
  )
}

export default App
