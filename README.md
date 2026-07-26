# Jacobscod Web3 Wallet SDK

React wallet connection components for EVM-compatible browser wallets. The package provides a wallet provider, a connection button, built-in wallet options, and Ethereum network examples.

## Requirements

- React 19 or later
- A browser wallet extension such as MetaMask, Coinbase Wallet, OKX Wallet, or Phantom
- An RPC URL for every configured chain
- Tailwind CSS v4 for the built-in component styles

## Installation

```bash
npm install jacobscod-wallet-sdk
```

The package depends on `react`, `react-dom`, and `ethers`. npm installs them with the SDK; applications with existing dependencies should use compatible versions.

```bash
npm install react react-dom ethers
```

## Quick Start

Wrap the application with `WalletProvider` and render `ConnectionButton` within the provider.

```tsx
import {
  // 钱包连接 UI 与上下文容器
  ConnectionButton,
  WalletProvider,
  // SDK 内置的钱包和链配置示例
  showWallets,
  supportChainsConfigs,
} from 'jacobscod-wallet-sdk'

// 为每条链替换为项目自己的 RPC 地址
const chains = supportChainsConfigs.map((chain) => ({
  ...chain,
  rpc: chain.id === 1
    ? 'https://your-mainnet-rpc-url'
    : 'https://your-sepolia-rpc-url',
}))

export default function App() {
  return (
    // autoConnect 会尝试恢复最近一次连接的钱包
    <WalletProvider chains={chains} wallets={showWallets} autoConnect>
      <ConnectionButton
        label="Connect wallet"
        // 业务侧可在此处理用户切换网络后的逻辑
        onChainChange={(fromChainId, toChainId) => {
          console.info(`Chain changed: ${fromChainId} -> ${toChainId}`)
        }}
      />
    </WalletProvider>
  )
}
```

`autoConnect` restores the most recently connected wallet from local storage. Replace the example RPC URLs before deploying an application.

## Tailwind CSS

`ConnectionButton` uses Tailwind utility classes. Tailwind v4 excludes dependencies from automatic source detection, so register the SDK in the consuming application's stylesheet.

```css
@import "tailwindcss";
/* 让 Tailwind 扫描 SDK 中的工具类 */
@source "../node_modules/jacobscod-wallet-sdk";
```

Adjust the relative path to match the location of the stylesheet in your application.

## Exports

| Export | Purpose |
| --- | --- |
| `WalletProvider` | Provides wallet state and connection actions to child components. |
| `ConnectionButton` | Displays the connection dialog, network switcher, address, and balance. |
| `useWallet` | Reads wallet state and actions inside a `WalletProvider`. |
| `showWallets` | Built-in MetaMask, Coinbase Wallet, OKX Wallet, and Phantom wallet options. |
| `supportChainsConfigs` | Ethereum Mainnet and Sepolia chain configuration examples. |

## Custom Chain Configuration

Pass a custom `chains` array to support the networks required by your application.

```tsx
// 根据项目需要声明支持的链
const chains = [
  {
    id: 11155111,
    name: 'Sepolia Testnet',
    rpc: 'https://your-sepolia-rpc-url',
    currency: {
      name: 'Sepolia Ether',
      symbol: 'SEP',
      decimals: 18,
      icon: 'https://sepolia.etherscan.io/favicon.ico',
    },
    blockExplorer: {
      name: 'Sepolia Etherscan',
      url: 'https://sepolia.etherscan.io',
    },
  },
]
```

## Development And Publishing

```bash
npm install
npm run build
npm pack --dry-run
```

`npm run build` builds the npm library to `dist/`. `npm pack --dry-run` shows the files included in the published package.
