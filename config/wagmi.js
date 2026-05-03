import { configureChains, createConfig } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID);
const CHAIN_NAME = process.env.NEXT_PUBLIC_CHAIN_NAME;
const CHAIN_SYMBOL = process.env.NEXT_PUBLIC_CHAIN_SYMBOL;
const BLOCK_EXPLORER = process.env.NEXT_PUBLIC_BLOCK_EXPLORER;
const BLOCK_EXPLORER_NAME = process.env.NEXT_PUBLIC_BLOCK_EXPLORER_NAME;

// Define custom chain
const customChain = {
  id: CHAIN_ID,
  name: CHAIN_NAME,
  network: CHAIN_NAME.toLowerCase(),
  nativeCurrency: {
    name: CHAIN_SYMBOL,
    symbol: CHAIN_SYMBOL,
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [RPC_URL],
    },
    public: {
      http: [RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: BLOCK_EXPLORER_NAME,
      url: BLOCK_EXPLORER,
    },
  },
  testnet: CHAIN_ID !== 1,
};

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [customChain],
  [
    jsonRpcProvider({
      rpc: () => ({ http: RPC_URL }),
    }),
  ],
  {
    retryCount: 0,
    pollingInterval: 2_000,
  }
);

// Use wagmi's InjectedConnector directly — no WalletConnect, no projectId needed
const connectors = [
  new InjectedConnector({
    chains,
    options: {
      name: "MetaMask",
      shimDisconnect: true,
    },
  }),
];

export const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

export { chains };
