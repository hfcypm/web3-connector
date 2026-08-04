import { ethers } from 'ethers'
//导入provider connectionButton
import { ConnectionButton, WalletProvider } from './wallet-sdk'
import { supportChainsConfigs } from './wallet-sdk/const/chain'
import { showWallets } from './wallet-sdk/const/wallets'
import './App.css'
import 'highlight.js/styles/github.css'
import { highlightedCode } from './wallet-sdk/utils'
import { Dice1Icon } from 'lucide-react'

const styles = {
  style: `<ConnectionButton/>`,
  style1: `<ConnectButton   
  label='连接钱包' 
  showWalletName={true} 
  size='lg' 
  onChainChange={onChainChangeEvent}
  />`,
  style2: `<ConnectButton 
  showWalletName={true}
  size='sm' 
  showBanlance={false} 
  onChainChange={onChainChangeEvent}
  className="bg-purple-300 text-black text-4xl hover:bg-orange-300"/>`,
  style3: ` <ConnectionButton.Custom>
  {({
    isConnected,
    address,
    balance,
    currentChain,
    connect,
    disconnect,
    error
  })............`,
  style4: `
  <ConnectionButton.Custom>
  {({ isConnected, address, connect, disconnect }) => (
    <button
      onClick={isConnected ? disconnect : connect}
      className="bg-black text-white px-6 py-3 rounded font-mono text-sm hover:bg-gray-800 transition-colors w-full truncate"
    >
      {isConnected ? address?.slice(0, 8) + '...' + address?.slice(-4) : 'Connect'}
    </button>
  )}
</ConnectionButton.Custom>
`
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
            <div className='space-y-6 mt-5'>
              <h2 className='text-2xl font-bold text-gray-800'>标题组件展示</h2>
              <div className='grid grid-cols-1 md:grid-cols-1 xl:grid-cols-2 gap-6 min-w-0 p-6'>

                {/* 默认样式 */}
                <div className='flex flex-col rounded-2xl p-2 shadow-xl border-2 border-gray-100'>
                  <text className='font-bold text-2xl'>默认样式</text>
                  <ConnectionButton />
                  <pre className='max-h-80 overflow-auto rounded-lg text-left text-sm leading-6'>
                    <code
                      className='hljs language-jsx'
                      dangerouslySetInnerHTML={{ __html: highlightedCode(styles.style, 'jsx') }}
                    />
                  </pre>
                </div>

                {/* 默认样式2 */}
                <div className='flex flex-col rounded-2xl p-2 shadow-xl border-2 border-gray-100'>
                  <text className='font-bold text-2xl'>默认样式2</text>
                  <ConnectionButton label='连接钱包' showWalletName={true} size='lg' onChainChange={onChainChangeEvent} />
                  <pre className='max-h-80 overflow-auto rounded-lg text-left text-sm leading-6'>
                    <code
                      className='hljs language-jsx'
                      dangerouslySetInnerHTML={{ __html: highlightedCode(styles.style1, 'jsx') }}
                    />
                  </pre>
                </div>

                {/* 默认样式3 */}
                <div className='flex flex-col rounded-2xl p-2 shadow-xl border-2 border-gray-100'>
                  <text className='font-bold text-2xl'>默认样式3</text>
                  <ConnectionButton showWalletName={true} size='sm' showBanlance={false}
                    onChainChange={onChainChangeEvent}
                    className="bg-purple-300 text-black text-4xl hover:bg-orange-300"
                  />
                  <pre className='max-h-80 overflow-auto rounded-lg text-left text-sm leading-6'>
                    <code
                      className='hljs language-jsx'
                      dangerouslySetInnerHTML={{ __html: highlightedCode(styles.style2, 'jsx') }}
                    />
                  </pre>
                </div>
              </div>
            </div>

            {/* 2. Custom组件展示 */}
            <div className='mt-5 space-x-5'>
              <h2 className='text-2xl font-bold text-gray-800'>Custom组件展示</h2>
              <div className='grid grid-cols-1  md:grid-cols-1 xl:grid-cols-2 gap-6 min-w-0 p-6'>

                {/* 仪表盘风格 */}
                <div className='flex flex-col rounded-2xl p-2 shadow-xl border-2 border-gray-100'>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    仪表板风格
                  </h3>
                  <div className="min-w-0 overflow-hidden">
                    <ConnectionButton.Custom>
                      {({
                        isConnected,
                        address,
                        balance,
                        currentChain,
                        connect,
                        disconnect,
                        error
                      }) => {
                        if (!isConnected) {
                          return (
                            <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                              <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                                连接钱包
                              </h4>
                              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                                连接您的钱包以访问所有功能
                              </p>
                              <button
                                onClick={connect}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
                              >
                                连接钱包
                              </button>
                              {error && (
                                <p className="text-red-500 text-sm mt-2 truncate">
                                  {error.message}
                                </p>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 border-l-4 border-green-500">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                                钱包已连接
                              </h4>
                              <div className="flex items-center text-green-600 flex-shrink-0">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                                <span className="text-sm font-medium">在线</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400">地址</label>
                                <div className="font-mono text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-600 p-2 rounded break-all">
                                  {address}
                                </div>
                              </div>

                              {balance && (
                                <div>
                                  <label className="text-xs text-gray-500 dark:text-gray-400">余额</label>
                                  <div className="text-lg font-semibold text-gray-800 dark:text-gray-200 truncate">
                                    {balance}
                                  </div>
                                </div>
                              )}

                              {currentChain && (
                                <div>
                                  <label className="text-xs text-gray-500 dark:text-gray-400">网络</label>
                                  <div className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                                    {currentChain.name}
                                  </div>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={disconnect}
                              className="w-full mt-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium py-2 px-4 rounded transition-colors"
                            >
                              断开连接
                            </button>
                          </div>
                        );
                      }}
                    </ConnectionButton.Custom>
                  </div>

                  <pre className='max-h-80 overflow-auto rounded-lg text-left text-sm leading-6'>
                    <code
                      className='hljs language-jsx'
                      dangerouslySetInnerHTML={{ __html: highlightedCode(styles.style3, 'jsx') }}
                    />
                  </pre>

                </div>

                <div className='flex flex-col rounded-2xl p-2 shadow-xl border-2 border-gray-100'>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    极简风格
                  </h3>
                  <div className="min-w-0 overflow-hidden">
                    <ConnectionButton.Custom>
                      {
                        ({ isConnected, address, connect, disconnect }) => (
                          <div>
                            <button
                              onClick={isConnected ? disconnect : connect}
                              className="bg-black text-white px-6 py-3 rounded font-mono text-sm hover:bg-gray-800 transition-colors w-full truncate"
                            >
                              {isConnected ? address?.slice(0, 8) + '...' + address?.slice(-4) : 'Connect'}
                            </button>
                            {
                              isConnected && <div onClick={disconnect} className='flex flex-row h-10 items-center 
                                    justify-center bg-black text-white rounded mt-2 
                                    hover:bg-gray-800 transition-colors'>
                                <span>disconnect</span>
                              </div>
                            }

                          </div>
                        )
                      }
                    </ConnectionButton.Custom>

                    <pre className='max-h-80 overflow-auto rounded-lg text-left text-sm leading-6'>
                      <code
                        className='hljs language-jsx'
                        dangerouslySetInnerHTML={{ __html: highlightedCode(styles.style4, 'jsx') }}
                      />
                    </pre>

                  </div>
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
