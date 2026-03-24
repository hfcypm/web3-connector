import { useState } from 'react'
import './App.css'
import WalletProvider from './wallet-sdk/provider'
import { supportChainsConfigs } from './wallet-sdk/chain'
import type { Wallet } from './wallet-sdk/types';

//钱包数组
const defWallets: Wallet[] = [];

function App() {
  return (
    <>
      <WalletProvider chains={supportChainsConfigs} wallets={defWallets}>
        <h1 className='bg-red-400 h-20 flex items-center justify-center'>web3-connector TEST
        </h1>
      </WalletProvider>
    </>
  )
}

export default App
