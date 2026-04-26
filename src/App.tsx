import { ethers } from 'ethers'
import './App.css'
import { supportChainsConfigs } from './wallet-sdk/chain'
//导入provider connectionButton
import { ConnectionButton, WalletProvider } from './wallet-sdk'
import { showWallets } from './wallet-sdk/wallets';

function App() {
  //window.ethereum：是 MetaMask 等钱包注入的原始对象，属于底层 API。
  //ethers.BrowserProvider：是 ethers.js 库提供的包装类（Wrapper），它接收 window.ethereum 作为参数，然后创建出一个更高级的 provider 对象。
  //钱包-ethers  provider
  // window.ethereum  ──作为参数──>  new ethers.BrowserProvider()  ──返回──>  provider (ethers 实例)
  //     (底层原始对象)                        (ethers 包装器)                    (高级 provider)
  const provider = new ethers.BrowserProvider(window.ethereum)
  return (
    //所有入参均在此配置--->入口
    <>
      <WalletProvider
        chains={supportChainsConfigs}
        provider={provider}
        wallets={showWallets}
        autoConnect={true}>
        <ConnectionButton />
      </WalletProvider>
    </>
  )
}

export default App
