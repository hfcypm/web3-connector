import { ethers } from 'ethers'
//导入provider connectionButton
import { ConnectionButton, WalletProvider } from './wallet-sdk'
import { supportChainsConfigs } from './wallet-sdk/const/chain'
import { showWallets } from './wallet-sdk/const/wallets'
import './App.css'
import 'highlight.js/styles/github.css'
import { highlightedCode } from './wallet-sdk/utils'

const styles = {
  style: `<ConnectionButton/>`,
  style1: `<ConnectButton   
  label="连接钱包"
  size="lg"
  showBalance={true}
  chainStatus="full"
  accountStatus="full"
  onConnect={handleConnect}
  />`,
  style2: `<ConnectButton 
  size="sm"
  chainStatus="icon"
  accountStatus="address"
  showBalance={false}
  className="shadow-md"/>`
}

function App() {
  //window.ethereum：是 MetaMask 等钱包注入的原始对象，属于底层 API。
  //ethers.BrowserProvider：是 ethers.js 库提供的包装类（Wrapper），它接收 window.ethereum 作为参数，然后创建出一个更高级的 provider 对象。
  //钱包-ethers  provider
  // window.ethereum  ──作为参数──>  new ethers.BrowserProvider()  ──返回──>  provider (ethers 实例)
  //     (底层原始对象)                        (ethers 包装器)                    (高级 provider)
  const provider = new ethers.BrowserProvider(window.ethereum)
  //收到网络切换事件
  const onChainChangeEvent = (fromChainId: number, toChainId: number) => {
  };

  return (
    <>
      <WalletProvider
        chains={supportChainsConfigs}
        provider={provider}
        wallets={showWallets}
        autoConnect={true}>

        {/* root */}
        <div className='flex flex-col min-h-screen space-y-8'>

          {/* 主容器 */}
          <div className='max-w-7xl'>

            {/* 1. 标题区域 */}
            <div className='text-center'>
              <h1 className='text-3xl font-bold'>Wallet SDK</h1>
              <text className='text-gray-500'>A simple, lightweight alternative to RainbowKit with powerful customization options</text>
            </div>

            {/* 2. 标题组件展示 */}
            <div className='space-y-6'>
              <h2 className='text-2xl font-bold text-gray-800'>标题组件展示</h2>
              <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 min-w-0 p-6'>

                <div className='flex flex-col rounded-2xl p-2 shadow-xl border-2 border-gray-100'>
                  <text className='font-bold text-2xl'>默认样式</text>
                  <ConnectionButton showWalletName={true} onChainChange={onChainChangeEvent} />
                  <pre className='max-h-80 overflow-auto rounded-lg text-left text-sm leading-6'>
                    <code
                      className='hljs language-jsx'
                      dangerouslySetInnerHTML={{ __html: highlightedCode(styles.style, 'jsx') }}
                    />
                  </pre>
                </div>

                <div className='flex flex-col rounded-2xl p-2 shadow-xl border-2 border-gray-100'>
                  <text className='font-bold text-2xl'>默认样式2</text>
                  <ConnectionButton showWalletName={true} onChainChange={onChainChangeEvent} />
                  <pre className='max-h-80 overflow-auto rounded-lg text-left text-sm leading-6'>
                    <code
                      className='hljs language-jsx'
                      dangerouslySetInnerHTML={{ __html: highlightedCode(styles.style1, 'jsx') }}
                    />
                  </pre>
                </div>

                <div className='flex flex-col rounded-2xl p-2 shadow-xl border-2 border-gray-100'>
                  <text className='font-bold text-2xl'>默认样式3</text>
                  <ConnectionButton showWalletName={true} onChainChange={onChainChangeEvent} />
                  <pre className='max-h-80 overflow-auto rounded-lg text-left text-sm leading-6'>
                    <code
                      className='hljs language-jsx'
                      dangerouslySetInnerHTML={{ __html: highlightedCode(styles.style2, 'jsx') }}
                    />
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </WalletProvider>
    </>
  )
}

export default App
