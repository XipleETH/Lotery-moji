import { useState, useEffect, useCallback } from 'react';
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

// Detect Coinbase Wallet directly from browser
const isCoinbaseWallet = () => {
  return typeof window !== 'undefined' && 
         window.ethereum && 
         (window.ethereum.isCoinbaseWallet || window.ethereum.selectedProvider?.isCoinbaseWallet);
};

// Get Coinbase Wallet provider
const getCoinbaseProvider = () => {
  if (typeof window === 'undefined') return null;
  
  // Check if Coinbase Wallet is available
  if (window.ethereum?.isCoinbaseWallet) {
    return window.ethereum;
  }
  
  // Check for multiple providers (e.g., MetaMask + Coinbase)
  if (window.ethereum?.providers) {
    const coinbaseProvider = window.ethereum.providers.find((provider: any) => 
      provider.isCoinbaseWallet
    );
    return coinbaseProvider || null;
  }
  
  return null;
};

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
    if (typeof window !== 'undefined') {
      checkConnection();
    }
  }, []);

  // Check if wallet is already connected
  const checkConnection = async () => {
    try {
      const provider = getCoinbaseProvider();
      if (!provider) return;
      
      const accounts = await provider.request({ method: 'eth_accounts' });
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
      const provider = getCoinbaseProvider();
      if (!provider) throw new Error('Coinbase Wallet not found');
      
      const ethersProvider = new ethers.BrowserProvider(provider);
      const network = await ethersProvider.getNetwork();
      const balance = await ethersProvider.getBalance(address);
      
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
      // Check if Coinbase Wallet is available
      const provider = getCoinbaseProvider();
      
      if (!provider) {
        throw new Error(
          'Coinbase Wallet no detectado. Por favor instala la extensión de Coinbase Wallet.'
        );
      }

      // Request account access
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length === 0) {
        throw new Error('No se encontraron cuentas en Coinbase Wallet');
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
      
      // Provide user-friendly error messages in Spanish
      let userMessage = err.message;
      if (err.code === 4001) {
        userMessage = 'Conexión cancelada por el usuario';
      } else if (err.message?.includes('User rejected')) {
        userMessage = 'Conexión rechazada. Por favor acepta la conexión en Coinbase Wallet.';
      } else if (err.message?.includes('not found') || err.message?.includes('no detectado')) {
        userMessage = 'Coinbase Wallet no detectado. Instala la extensión desde coinbase.com/es/wallet';
      }
      
      setError(userMessage);
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
    
    setError(null);
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
      setError(err.message || 'Error al cambiar de red');
    } finally {
      setLoading(false);
    }
  }, [wallet.address]);

  // Listen for account changes
  useEffect(() => {
    const provider = getCoinbaseProvider();
    if (!provider) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        await updateWalletState(accounts[0]);
      }
    };

    provider.on('accountsChanged', handleAccountsChanged);
    return () => provider.removeListener('accountsChanged', handleAccountsChanged);
  }, [disconnect]);

  // Listen for chain changes
  useEffect(() => {
    const provider = getCoinbaseProvider();
    if (!provider) return;

    const handleChainChanged = async (chainId: string) => {
      const newChainId = parseInt(chainId, 16);
      
      if (newChainId !== BASE_SEPOLIA_CONFIG.chainId) {
        setError('Por favor cambia a la red Base Sepolia');
      } else {
        setError(null);
        if (wallet.address) {
          await updateWalletState(wallet.address);
        }
      }
    };

    provider.on('chainChanged', handleChainChanged);
    return () => provider.removeListener('chainChanged', handleChainChanged);
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

  // Get wallet status info
  const getWalletStatus = useCallback(() => {
    if (!isCoinbaseWallet()) {
      return {
        status: 'not-available',
        message: 'Coinbase Wallet no instalado',
        action: 'install'
      };
    }
    
    if (!wallet.isConnected) {
      return {
        status: 'not-connected',
        message: 'Wallet no conectado',
        action: 'connect'
      };
    }
    
    if (!isCorrectNetwork()) {
      return {
        status: 'wrong-network',
        message: 'Red incorrecta - Se necesita Base Sepolia',
        action: 'switch-network'
      };
    }
    
    if (!hasEnoughUSDC()) {
      return {
        status: 'insufficient-usdc',
        message: 'USDC insuficiente para comprar tickets',
        action: 'get-usdc'
      };
    }
    
    return {
      status: 'ready',
      message: 'Wallet lista para usar',
      action: null
    };
  }, [wallet, isCorrectNetwork, hasEnoughUSDC]);

  // Format address for display
  const formatAddress = useCallback((address?: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  // Get network name
  const getNetworkName = useCallback(() => {
    switch (wallet.chainId) {
      case 84532:
        return 'Base Sepolia';
      case 8453:
        return 'Base Mainnet';
      case 1:
        return 'Ethereum Mainnet';
      default:
        return `Chain ID: ${wallet.chainId}`;
    }
  }, [wallet.chainId]);

  return {
    // Wallet state
    wallet,
    loading,
    error,
    
    // Actions
    connect,
    disconnect,
    switchChain,
    refreshWallet,
    
    // Utilities
    hasEnoughUSDC,
    hasEnoughAllowance,
    isCorrectNetwork,
    getWalletStatus,
    formatAddress,
    getNetworkName,
    
    // Computed values
    isWalletAvailable: !!isCoinbaseWallet(),
    isConnected: wallet.isConnected,
    address: wallet.address,
    balance: wallet.balance,
    usdcBalance: wallet.usdcBalance,
    chainId: wallet.chainId,
  };
}; 