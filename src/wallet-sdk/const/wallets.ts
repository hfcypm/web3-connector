import { coinbaseWallet } from "../connectors/coinbase";
import { metaMaskWallet } from "../connectors/metamask";
import { okxWallet } from "../connectors/okx";

//弹窗中需要展示的钱包列表
export const showWallets = [
    metaMaskWallet,
    coinbaseWallet,
    okxWallet,
]