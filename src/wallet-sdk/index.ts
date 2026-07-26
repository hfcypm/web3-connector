import walletSdkStyles from './styles.css?inline'
import ConnectionButton from "./componets/ConnectionButton";
import WalletProvider, { useWallet } from "./provider";

const STYLE_ELEMENT_ID = 'jacobscod-wallet-sdk-styles'

function injectWalletSdkStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ELEMENT_ID)) {
    return
  }

  const styleElement = document.createElement('style')
  styleElement.id = STYLE_ELEMENT_ID
  styleElement.textContent = walletSdkStyles
  document.head.appendChild(styleElement)
}

injectWalletSdkStyles()

export { ConnectionButton, WalletProvider, useWallet };
export { supportChainsConfigs } from "./const/chain";
export { showWallets } from "./const/wallets";
export type { Chain, Wallet, WalletContextValue, WalletProviderProps } from "./types";
