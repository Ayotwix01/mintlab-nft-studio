"use client";

import {
  useConnection,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { sepolia } from "wagmi/chains";

export function useWallet() {
  const { address, chainId, status } = useConnection();

  const {
    connectors,
    connect,
    isPending: isConnecting,
    error: connectError,
  } = useConnect();

  const { disconnect } = useDisconnect();

  const {
    switchChain,
    isPending: isSwitching,
    error: switchError,
  } = useSwitchChain();

  const isConnected = status === "connected";
  const isSepolia = chainId === sepolia.id;

  function connectWallet() {
    const injectedConnector = connectors.find(
      (connector) => connector.id === "injected",
    );

    if (!injectedConnector) {
      return;
    }

    connect({ connector: injectedConnector });
  }

  function disconnectWallet() {
    disconnect();
  }

  function switchToSepolia() {
    switchChain({ chainId: sepolia.id });
  }

  return {
    address,
    chainId,
    isConnected,
    isSepolia,
    isConnecting,
    isSwitching,
    connectWallet,
    disconnectWallet,
    switchToSepolia,
    walletError: connectError?.message ?? switchError?.message ?? null,
  };
}
