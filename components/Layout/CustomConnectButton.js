import { useAccount, useConnect, useDisconnect, useNetwork, useSwitchNetwork } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import { RiWallet3Line } from "react-icons/ri";

// Create connector ONCE outside the component — never re-instantiate on each render
const injectedConnector = new InjectedConnector();

const CustomConnectButton = ({ active, childStyle }) => {
  const { address, isConnected } = useAccount();
  const { connect, isLoading: isConnecting } = useConnect({ connector: injectedConnector });
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();

  const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID);

  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleConnect = () => {
    connect();
  };

  // If connected but on wrong chain, offer to switch
  const isWrongNetwork = isConnected && chain && chain.id !== CHAIN_ID;

  if (!isConnected) {
    return (
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className={`
            relative flex items-center justify-center space-x-3 
            bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 
            hover:from-blue-600 hover:via-purple-700 hover:to-indigo-700
            text-white font-semibold px-6 py-3 rounded-2xl 
            shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40
            transform hover:scale-105 transition-all duration-300
            border border-white/20 backdrop-blur-sm
            disabled:opacity-70 disabled:cursor-wait
            ${childStyle}
          `}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl"></div>
          <div className="relative">
            <RiWallet3Line className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <span className="relative text-sm font-bold tracking-wide">
            {isConnecting ? "CONNECTING..." : "CONNECT WALLET"}
          </span>
          {!isConnecting && (
            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-1 h-1 bg-white/60 rounded-full animate-ping delay-100"></div>
              <div className="w-1 h-1 bg-white/60 rounded-full animate-ping delay-200"></div>
              <div className="w-1 h-1 bg-white/60 rounded-full animate-ping delay-300"></div>
            </div>
          )}
        </button>
      </div>
    );
  }

  if (isWrongNetwork) {
    return (
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
        <button
          onClick={() => switchNetwork?.(CHAIN_ID)}
          className="
            relative flex items-center justify-center space-x-2
            bg-gradient-to-r from-red-500 to-pink-600 
            hover:from-red-600 hover:to-pink-700
            text-white font-semibold px-6 py-3 rounded-2xl
            shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/40
            transform hover:scale-105 transition-all duration-300
            border border-white/20 backdrop-blur-sm
          "
        >
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
          <span className="text-sm font-bold">Switch Network</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Chain badge */}
      {active && chain && (
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
          <div className="relative flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg border border-white/20">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold">{chain.name}</span>
          </div>
        </div>
      )}

      {/* Account button — click to disconnect */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 via-purple-600 to-violet-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
        <button
          onClick={() => disconnect()}
          className="
            relative flex items-center justify-center space-x-3
            bg-gradient-to-r from-fuchsia-500 via-purple-600 to-violet-600 
            hover:from-fuchsia-600 hover:via-purple-700 hover:to-violet-700
            text-white font-semibold px-5 py-2.5 rounded-xl
            shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40
            transform hover:scale-105 transition-all duration-300
            border border-white/20 backdrop-blur-sm
            min-w-0 max-w-48
          "
          title="Click to disconnect"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl"></div>
          <div className="relative flex-shrink-0">
            <div className="w-7 h-7 bg-gradient-to-br from-white/20 to-white/5 rounded-full flex items-center justify-center ring-2 ring-white/30">
              <div className="w-3 h-3 bg-white/80 rounded-full"></div>
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white/50 animate-pulse"></div>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm font-bold truncate">{formatAddress(address)}</div>
          </div>
          <div className="flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default CustomConnectButton;
