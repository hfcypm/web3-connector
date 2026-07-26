import { ethers } from "ethers";
import hljs from 'highlight.js';

/**
 * 检测 OKX 钱包是否安装
 * OKX provider 注入位置有三种：
 *  1. window.okxwallet —— OKX 独立命名空间（即使 window.ethereum 被其他钱包占用也能拿到）
 *  2. window.ethereum.isOkxWallet —— 作为默认钱包时挂到 window.ethereum
 *  3. window.ethereum.providers[] —— 多钱包共存时（EIP-5749 兼容数组），查找其中的 OKX provider
 */
export const isOkxWalletInstalled = (): boolean => {
    if (typeof window === "undefined") return false;
    const win = window as any;
    const ethereum = win.ethereum;
    const okxWallet = win.okxwallet;
    if (!!okxWallet) return true;
    if (!!ethereum && ethereum.isOkxWallet === true) return true;
    // 多钱包共存时，window.ethereum 会暴露 providers 数组
    if (ethereum && Array.isArray(ethereum.providers)) {
        return ethereum.providers.some((p: any) => p?.isOkxWallet);
    }
    return false;
}

/**
 * Detects if MetaMask is installed
 * @returns Boolean indicating if MetaMask is available
 */
export const isMetaMaskInstalled = (): boolean => {
    return typeof window !== 'undefined' &&
        typeof window.ethereum !== 'undefined' &&
        window.ethereum.isMetaMask === true;
};

/**
 * Truncates an Ethereum address to a displayable format
 * @param address Full Ethereum address
 * @param startLength Number of characters to show at start
 * @param endLength Number of characters to show at end
 * @returns Truncated address string
 */
export const truncateAddress = (
    address: string,
    startLength = 4,
    endLength = 4
): string => {
    if (!address) return '';

    const start = address.substring(0, startLength + 2);
    const end = address.substring(address.length - endLength);

    return `${start}...${end}`;
};

/**
 * Format ETH value to readable format
 * @param value Value in wei
 * @param decimals Number of decimals to display
 * @returns Formatted ETH value with symbol
 */
export const formatEther = (
    value: string | number,
    decimals = 4
): string => {
    if (!value) return '0 ETH';

    const formatted = parseFloat(ethers.formatEther(value.toString()))
        .toFixed(decimals)
        .replace(/\.?0+$/, ''); // Remove trailing zeros

    return `${formatted} ETH`;
};

/**
 * Gets local storage value with expiry check
 * @param key Storage key
 * @returns Stored value or null if expired/not found
 */
export const getStorageItem = <T>(key: string): T | null => {
    const item = localStorage.getItem(key);
    if (!item) return null;

    try {
        const { value, expiry } = JSON.parse(item);
        if (expiry && new Date().getTime() > expiry) {
            localStorage.removeItem(key);
            return null;
        }
        return value as T;
    } catch (e) {
        return null;
    }
};

/**
 * Sets local storage value with optional expiry
 * @param key Storage key
 * @param value Value to store
 * @param expiryInHours Optional expiry in hours
 */
export const setStorageItem = <T>(
    key: string,
    value: T,
    expiryInHours?: number
): void => {
    const item = {
        value,
        expiry: expiryInHours
            ? new Date().getTime() + expiryInHours * 60 * 60 * 1000
            : null,
    };

    localStorage.setItem(key, JSON.stringify(item));
};


/**
 * Check if we're in a mobile browser
 * @returns Boolean indicating if browser is mobile
 */
export const isMobileBrowser = (): boolean => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );
};

/**
 * Get network name from chain ID
 * @param chainId Ethereum chain ID
 * @returns Network name
 */
export const getNetworkName = (chainId: number): string => {
    const networks: Record<number, string> = {
        1: 'Ethereum',
        5: 'Goerli',
        11155111: 'Sepolia',
        137: 'Polygon',
        80001: 'Mumbai',
        42161: 'Arbitrum',
        10: 'Optimism',
        56: 'BSC',
        43114: 'Avalanche',
    };

    return networks[chainId] || `Chain ${chainId}`;
};

/** 根据不同钱包 EIP1193返回 网络chainID类型不同 做兼容转换 */
export const parseChainId = (value: string | number) => {
    if (typeof value === 'number') {
        return value;
    }

    if (value.startsWith('0x')) {
        return Number.parseInt(value, 16);
    } else {
        return Number(value)
    }
}

/** 代码高亮方式 */
export const highlightedCode = (code: string, language: string = 'jsx') => {
    try {
        const languageDic: { [key: string]: string } = {
            'jsx': 'javascript',
            'tsx': 'typescript',
            'ts': 'typescript',
            'js': 'javascript'
        }
        const hlLanguage = languageDic[language] || language;
        //使用引入的库进行高亮
        const result = hljs.highlight(code, { language: hlLanguage })
        return result.value
    } catch {
        // 降级到自动检测语言
        console.log('降级到自动检测语言')
        return hljs.highlightAuto(code).value;
    }
}