//创建context 提供数据设置
const WalletContext = React.createContext({
    wallInfo: null,
    setWalletInfo: () => { }
});

//创建provider
export function WalletProvider({ children }) {
    //通过provider包裹组件
    return (<WalletContext.Provider value={{ wallInfo: null, setWalletInfo: () => { } }}>
        {children}
    </WalletContext.Provider>);
}

export default WalletContext;

