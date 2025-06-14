import { useState, useEffect, useCallback } from 'react';
import { CoinbaseWalletSDK } from '@coinbase/wallet-sdk';
import { ethers } from 'ethers';
import { UseWalletReturn, WalletState } from '@/types/lottery';
import { 
  BASE_SEPOLIA_CONFIG, 
  getUSDCBalance, 
  getUSDCAllowance, 
  getContractConfig,
  isCorrectChain,
  switchToBaseSepoliaChain 
} from '@/utils/blockchain';

// Coinbase Wallet configuration
const coinbaseWallet = new CoinbaseWalletSDK({
  appName: 'LottoMoji - Crypto Emoji Lottery',
  appLogoUrl: '/lottomoji-logo.png',
  darkMode: true,
});

const ethereum = coinbaseWallet.makeWeb3Provider(
  BASE_SEPOLIA_CONFIG.rpcUrl,
  BASE_SEPOLIA_CONFIG.chainId
);

export const useWallet = (): UseWalletReturn => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: undefined,
    chainId: undefined,
    balance: undefined,
    usdcBalance: undefined,
    usdcAllowance: undefined,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize wallet state on component mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Check if wallet is already connected
  const checkConnection = async () => {
    try {
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        await updateWalletState(accounts[0]);
      }
    } catch (err) {
      console.error('Error checking connection:', err);
    }
  };

  // Update wallet state with current info
  const updateWalletState = async (address: string) => {
    try {
      const provider = new ethers.BrowserProvider(ethereum);
      const network = await provider.getNetwork();
      const balance = await provider.getBalance(address);
      
      // Get USDC balance and allowance
      const usdcBalance = await getUSDCBalance(address);
      const config = getContractConfig();
      const usdcAllowance = config.lotteryAddress 
        ? await getUSDCAllowance(address, config.lotteryAddress)
        : 0;

      setWallet({
        isConnected: true,
        address,
        chainId: Number(network.chainId),
        balance: Number(ethers.formatEther(balance)),
        usdcBalance,
        usdcAllowance,
      });
    } catch (err) {
      console.error('Error updating wallet state:', err);
      setError('Failed to update wallet state');
    }
  };

  // Connect to Coinbase Wallet
  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Request account access if needed
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];
      
      // Check if we're on the correct chain
      const correctChain = await isCorrectChain();
      if (!correctChain) {
        await switchToBaseSepoliaChain();
      }
      
      await updateWalletState(address);
      
    } catch (err: any) {
      console.error('Connection error:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setWallet({
      isConnected: false,
      address: undefined,
      chainId: undefined,
      balance: undefined,
      usdcBalance: undefined,
      usdcAllowance: undefined,
    });
    
    // Clear any stored connection data
    localStorage.removeItem('walletconnect');
  }, []);

  // Switch to Base Sepolia chain
  const switchChain = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await switchToBaseSepoliaChain();
      
      // Refresh wallet state after chain switch
      if (wallet.address) {
        await updateWalletState(wallet.address);
      }
    } catch (err: any) {
      console.error('Chain switch error:', err);
      setError(err.message || 'Failed to switch chain');
    } finally {
      setLoading(false);
    }
  }, [wallet.address]);

  // Listen for account changes
  useEffect(() => {
    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        await updateWalletState(accounts[0]);
      }
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    return () => ethereum.off('accountsChanged', handleAccountsChanged);
  }, [disconnect]);

  // Listen for chain changes
  useEffect(() => {
    const handleChainChanged = async (chainId: string) => {
      const newChainId = parseInt(chainId, 16);
      
      if (newChainId !== BASE_SEPOLIA_CONFIG.chainId) {
        setError('Please switch to Base Sepolia network');
      } else {
        setError(null);
        if (wallet.address) {
          await updateWalletState(wallet.address);
        }
      }
    };

    ethereum.on('chainChanged', handleChainChanged);
    return () => ethereum.off('chainChanged', handleChainChanged);
  }, [wallet.address]);

  // Refresh wallet data
  const refreshWallet = useCallback(async () => {
    if (wallet.address) {
      await updateWalletState(wallet.address);
    }
  }, [wallet.address]);

  // Check if user has enough USDC for ticket
  const hasEnoughUSDC = useCallback((amount: number = 2) => {
    return wallet.usdcBalance !== undefined && wallet.usdcBalance >= amount;
  }, [wallet.usdcBalance]);

  // Check if user has enough USDC allowance
  const hasEnoughAllowance = useCallback((amount: number = 2) => {
    return wallet.usdcAllowance !== undefined && wallet.usdcAllowance >= amount;
  }, [wallet.usdcAllowance]);

  // Check if connected to correct chain
  const isCorrectNetwork = useCallback(() => {
    return wallet.chainId === BASE_SEPOLIA_CONFIG.chainId;
  }, [wallet.chainId]);

  return {
    wallet,
    connect,
    disconnect,
    switchChain,
    loading,
    error,
    // Additional utilities
    refreshWallet,
    hasEnoughUSDC,
    hasEnoughAllowance,
    isCorrectNetwork,
  };
}; 